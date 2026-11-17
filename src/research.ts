import {
  TavilyResearchOptions,
  TavilyResearchFunction,
  TavilyGetResearchFunction,
  TavilyGetResearchOptions,
  TavilyGetResearchIncompleteStatusResponse,
  TavilyGetResearchResponse,
} from "./types";
import { TavilyTransport } from "./transport";
import { identityHeaders } from "./headers";

type RawResearch = {
  request_id: string;
  created_at: string;
  status: string;
  input: string;
  model: string;
  response_time: number;
};

type RawGetResearch = {
  request_id: string;
  created_at?: string;
  response_time: number;
  [key: string]: unknown;
};

export function _research(transport: TavilyTransport): TavilyResearchFunction {
  return async function research(
    input: string,
    options: Partial<TavilyResearchOptions> = {}
  ) {
    const {
      model, outputSchema, stream, citationFormat, includeDomains, excludeDomains, outputLength,
      timeout, sessionId, humanId, clientName, ...kwargs
    } = options;

    const opts = { timeoutSeconds: timeout, headers: identityHeaders({ sessionId, humanId, clientName }) };
    const body = {
      input,
      model,
      output_schema: outputSchema,
      stream,
      citation_format: citationFormat,
      include_domains: includeDomains,
      exclude_domains: excludeDomains,
      output_length: outputLength,
      ...kwargs,
    };

    if (stream) {
      return transport.stream("research", body, opts);
    }

    const data = await transport.post<RawResearch>("research", body, opts);

    return {
      requestId: data.request_id,
      createdAt: data.created_at,
      status: data.status,
      input: data.input,
      model: data.model,
      responseTime: data.response_time,
    };
  };
}

export function _getResearch(transport: TavilyTransport): TavilyGetResearchFunction {
  return async function getResearch(
    requestId: string,
    options: TavilyGetResearchOptions = {}
  ) {
    const { includeUsage } = options;

    const { request_id, created_at, response_time, ...rest } = await transport.get<RawGetResearch>(
      `research/${encodeURIComponent(requestId)}`,
      {
        timeoutSeconds: 60, // Default timeout for GET requests
        params: { include_usage: includeUsage },
      }
    );

    return { ...rest, requestId: request_id, createdAt: created_at, responseTime: response_time } as
      TavilyGetResearchResponse | TavilyGetResearchIncompleteStatusResponse;
  };
}
