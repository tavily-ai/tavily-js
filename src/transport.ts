import axios, { AxiosAdapter, AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { Readable } from "stream";
import { TavilyClientOptions } from "./types";
import {
  TavilyRequestError,
  isKeylessLimitEnvelope,
  keylessLimitErrorFromEnvelope,
} from "./errors";

const BASE_URL = "https://api.tavily.com";

export type TavilyTransport = {
  post(
    endpoint: string,
    body: Record<string, unknown>,
    opts?: { timeoutSeconds?: number }
  ): Promise<unknown>;
  get(
    endpoint: string,
    opts?: { timeoutSeconds?: number; params?: Record<string, unknown> }
  ): Promise<unknown>;
  stream(
    endpoint: string,
    body: Record<string, unknown>,
    opts?: { timeoutSeconds?: number }
  ): Promise<AsyncIterable<Buffer>>;
};

async function readBody(stream: Readable): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function* chunks(stream: Readable): AsyncGenerator<Buffer> {
  try {
    yield* stream;
  } finally {
    stream.destroy();
  }
}

/**
 * Authenticated access to the Tavily API. `post`, `get`, and `stream` resolve with the
 * response body untouched. Non-2xx responses reject with `TavilyRequestError`, or with
 * `TavilyKeylessLimitError` for a keyless-limit envelope in keyless mode.
 */
export function createTransport(
  options: TavilyClientOptions & { adapter?: AxiosAdapter } = {}
): TavilyTransport {
  const apiKey = options.apiKey || process.env.TAVILY_API_KEY;
  const baseURL = options.apiBaseURL || BASE_URL;
  const httpProxy = options.proxies?.http || process.env.TAVILY_HTTP_PROXY;
  const httpsProxy = options.proxies?.https || process.env.TAVILY_HTTPS_PROXY;
  const projectId = options.projectId || process.env.TAVILY_PROJECT;
  const orgId = options.orgId || process.env.TAVILY_ORG_ID;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Client-Source": options.clientSource || (apiKey ? "tavily-js" : "tavily-js-keyless"),
  };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  else headers["X-Tavily-Access-Mode"] = "keyless";
  if (projectId) headers["X-Project-ID"] = projectId;
  if (orgId) headers["X-Tavily-Orgid"] = orgId;
  if (options.sessionId) headers["X-Session-Id"] = options.sessionId;
  if (options.humanId) headers["X-Human-Id"] = options.humanId;
  if (options.clientName) headers["X-Client-Name"] = options.clientName;

  async function toError(err: unknown, timeout: number | undefined): Promise<Error> {
    if (err instanceof AxiosError && err.code === "ECONNABORTED") {
      return new Error(`Request timed out after ${timeout ?? 0} seconds.`);
    }
    if (!(err instanceof AxiosError) || !err.response) {
      return new Error(`An unexpected error occurred while making the request. Error: ${err}`);
    }
    const { status } = err.response;
    const body: any =
      err.response.data instanceof Readable ? await readBody(err.response.data) : err.response.data;
    if (!apiKey && isKeylessLimitEnvelope(body)) {
      return keylessLimitErrorFromEnvelope(body);
    }
    const message = body?.detail?.error;
    const docs = body?.documentation;
    return new TavilyRequestError({
      message:
        typeof message === "string" && message ? message : `${status} Error: ${JSON.stringify(body)}`,
      status,
      body,
      docs: typeof docs === "string" ? docs : undefined,
    });
  }

  async function send(
    endpoint: string,
    request: AxiosRequestConfig,
    timeoutSeconds?: number
  ): Promise<AxiosResponse> {
    // Research endpoints have no default timeout.
    const timeout = endpoint.includes("research") ? timeoutSeconds : timeoutSeconds ?? 60;
    const config: AxiosRequestConfig = {
      ...request,
      url: `${baseURL}/${endpoint}`,
      headers,
      adapter: options.adapter,
    };
    if (timeout !== undefined) config.timeout = timeout * 1000;
    if (httpProxy) config.httpAgent = new HttpsProxyAgent(httpProxy);
    if (httpsProxy) config.httpsAgent = new HttpsProxyAgent(httpsProxy);
    try {
      return await axios.request(config);
    } catch (err) {
      throw await toError(err, timeout);
    }
  }

  return {
    async post(endpoint, body, opts) {
      return (await send(endpoint, { method: "post", data: body }, opts?.timeoutSeconds)).data;
    },
    async get(endpoint, opts) {
      return (await send(endpoint, { method: "get", params: opts?.params }, opts?.timeoutSeconds))
        .data;
    },
    async stream(endpoint, body, opts) {
      const response = await send(
        endpoint,
        { method: "post", data: body, responseType: "stream" },
        opts?.timeoutSeconds
      );
      return chunks(response.data);
    },
  };
}
