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

    const data: any = await transport.post("research", body, opts);

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

    const data = await transport.get(`research/${requestId}`, {
      timeoutSeconds: 60, // Default timeout for GET requests
      params: { include_usage: includeUsage },
    });
    return data as
      | TavilyGetResearchResponse
      | TavilyGetResearchIncompleteStatusResponse;
  };
}
