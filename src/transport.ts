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

type RequestOpts = { timeoutSeconds?: number; headers?: Record<string, string> };

export type TavilyTransport = {
  post<T = unknown>(endpoint: string, body: Record<string, unknown>, opts?: RequestOpts): Promise<T>;
  get<T = unknown>(
    endpoint: string,
    opts?: RequestOpts & { params?: Record<string, unknown> }
  ): Promise<T>;
  stream(
    endpoint: string,
    body: Record<string, unknown>,
    opts?: RequestOpts
  ): Promise<AsyncGenerator<Buffer, void, unknown>>;
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

async function* chunks(stream: Readable): AsyncGenerator<Buffer, void, unknown> {
  try {
    yield* stream;
  } finally {
    stream.destroy();
  }
}

/**
 * Authenticated access to the Tavily API. `post`, `get`, and `stream` resolve with the
 * response body untouched. Non-2xx responses reject with `TavilyRequestError`, or with
 * `TavilyKeylessLimitError` for a keyless-limit envelope. Per-request `headers` are merged
 * over the transport's own.
 */
export function createTransport(
  options: TavilyClientOptions & { adapter?: AxiosAdapter } = {}
): TavilyTransport {
  const apiKey = options.apiKey || process.env.TAVILY_API_KEY;
  const baseURL = options.apiBaseURL || BASE_URL;
  const httpProxy = options.proxies?.http || process.env.TAVILY_HTTP_PROXY;
  const httpsProxy = options.proxies?.https || process.env.TAVILY_HTTPS_PROXY;
  const httpAgent = httpProxy ? new HttpsProxyAgent(httpProxy) : undefined;
  const httpsAgent = httpsProxy ? new HttpsProxyAgent(httpsProxy) : undefined;
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
    let body: unknown = err.response.data;
    if (body instanceof Readable) {
      try {
        body = await readBody(body);
      } catch {
        body = undefined;
      }
    }
    if (isKeylessLimitEnvelope(body)) {
      return keylessLimitErrorFromEnvelope(body, status);
    }
    const { detail, error } = (body ?? {}) as {
      detail?: { error?: unknown };
      error?: { message?: unknown };
    };
    const message = detail?.error ?? error?.message;
    return new TavilyRequestError({
      message:
        typeof message === "string" && message ? message : `${status} Error: ${JSON.stringify(body)}`,
      status,
      body,
    });
  }

  async function send(
    endpoint: string,
    request: AxiosRequestConfig,
    opts: RequestOpts = {}
  ): Promise<AxiosResponse> {
    // Research endpoints have no default timeout.
    const timeout = endpoint.includes("research") ? opts.timeoutSeconds : opts.timeoutSeconds ?? 60;
    const config: AxiosRequestConfig = {
      ...request,
      url: `${baseURL}/${endpoint}`,
      headers: { ...headers, ...opts.headers },
      adapter: options.adapter,
      httpAgent,
      httpsAgent,
    };
    if (timeout !== undefined) config.timeout = timeout * 1000;
    try {
      return await axios.request(config);
    } catch (err) {
      throw await toError(err, timeout);
    }
  }

  return {
    async post(endpoint, body, opts) {
      return (await send(endpoint, { method: "post", data: body }, opts)).data;
    },
    async get(endpoint, opts) {
      return (await send(endpoint, { method: "get", params: opts?.params }, opts)).data;
    },
    async stream(endpoint, body, opts) {
      const response = await send(
        endpoint,
        { method: "post", data: body, responseType: "stream" },
        opts
      );
      return chunks(response.data);
    },
  };
}
