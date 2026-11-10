import {
  TavilyResearchOptions,
  TavilyResearchFunction,
  TavilyGetResearchFunction,
  TavilyGetResearchOptions,
  TavilyRequestConfig,
  TavilyGetResearchIncompleteStatusResponse,
  TavilyGetResearchResponse,
} from "./types";
import { createTransport } from "./transport";

export function _research(requestConfig: TavilyRequestConfig): TavilyResearchFunction {
  return async function research(
    input: string,
    options: Partial<TavilyResearchOptions> = {}
  ) {
    const { model, outputSchema, stream, citationFormat, timeout, sessionId, humanId, clientName, ...kwargs } =
      options;

    const callConfig: TavilyRequestConfig = {
      ...requestConfig,
      ...(sessionId !== undefined && { sessionId }),
      ...(humanId !== undefined && { humanId }),
      ...(clientName !== undefined && { clientName }),
    };
    const transport = createTransport(callConfig);

    const body = {
      input,
      model,
      output_schema: outputSchema,
      stream,
      citation_format: citationFormat,
      ...kwargs,
    };

    if (stream) {
      return transport.stream("research", body, { timeoutSeconds: timeout });
    }

    const data: any = await transport.post("research", body, { timeoutSeconds: timeout });

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

export function _getResearch(requestConfig: TavilyRequestConfig): TavilyGetResearchFunction {
  return async function getResearch(
    requestId: string,
    options: TavilyGetResearchOptions = {}
  ) {
    const { includeUsage } = options;

    const data = await createTransport(requestConfig).get(`research/${requestId}`, {
      timeoutSeconds: 60, // Default timeout for GET requests
      params: { include_usage: includeUsage },
    });
    return data as
      | TavilyGetResearchResponse
      | TavilyGetResearchIncompleteStatusResponse;
  };
}
