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

export function _research(transport: TavilyTransport): TavilyResearchFunction {
  return async function research(
    input: string,
    options: Partial<TavilyResearchOptions> = {}
  ) {
    const { model, outputSchema, stream, citationFormat, timeout, sessionId, humanId, clientName, ...kwargs } =
      options;

    const opts = { timeoutSeconds: timeout, headers: identityHeaders({ sessionId, humanId, clientName }) };
    const body = {
      input,
      model,
      output_schema: outputSchema,
      stream,
      citation_format: citationFormat,
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

    return transport.get<TavilyGetResearchResponse | TavilyGetResearchIncompleteStatusResponse>(
      `research/${requestId}`,
      {
        timeoutSeconds: 60, // Default timeout for GET requests
        params: { include_usage: includeUsage },
      }
    );
  };
}
