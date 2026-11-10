import {
  TavilyExtractOptions,
  TavilyExtractFunction,
} from "./types";
import { TavilyTransport } from "./transport";
import { identityHeaders } from "./headers";

export function _extract(transport: TavilyTransport): TavilyExtractFunction {
  return async function extract(
    urls: Array<string>,
    options: Partial<TavilyExtractOptions> = {}
  ) {
    const { includeImages, extractDepth, format, timeout, includeFavicon, includeUsage, query, chunksPerSource, sessionId, humanId, clientName, ...kwargs } = options;

    const requestTimeout = timeout ?? 30; // Default to 30s

    const data: any = await transport.post(
      "extract",
      {
        urls,
        include_images: includeImages,
        extract_depth: extractDepth,
        format,
        include_favicon: includeFavicon,
        timeout, // Add timeout to the payload
        include_usage: includeUsage,
        query,
        chunks_per_source: chunksPerSource,
        ...kwargs,
      },
      { timeoutSeconds: requestTimeout, headers: identityHeaders({ sessionId, humanId, clientName }) }
    );

    return {
      responseTime: data.response_time,
      results: data.results.map((result: any) => {
        return {
          url: result.url,
          title: result.title,
          rawContent: result.raw_content,
          images: result.images,
          favicon: result.favicon,
        };
      }),
      failedResults: data.failed_results.map((result: any) => {
        return {
          url: result.url,
          error: result.error,
        };
      }),
      requestId: data.request_id,
      ...(data.usage !== undefined && { usage: data.usage }),
    };
  };
}
