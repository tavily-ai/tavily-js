import {
  TavilyCrawlOptions,
  TavilyCrawlFunction,
} from "./types";
import { TavilyTransport } from "./transport";
import { identityHeaders } from "./headers";

export function _crawl(transport: TavilyTransport): TavilyCrawlFunction {
  return async function crawl(
    url: string,
    options: Partial<TavilyCrawlOptions> = {}
  ) {
    const {
      maxDepth,
      maxBreadth,
      limit,
      extractDepth,
      selectPaths,
      selectDomains,
      excludePaths,
      excludeDomains,
      allowExternal,
      includeImages,
      instructions,
      format,
      timeout,
      includeFavicon,
      includeUsage,
      chunksPerSource,
      sessionId,
      humanId,
      clientName,
      ...kwargs
    } = options;

    const requestTimeout = timeout ?? 150; // Default to 150s

    const data: any = await transport.post(
      "crawl",
      {
        url: url,
        max_depth: maxDepth,
        max_breadth: maxBreadth,
        limit,
        extract_depth: extractDepth,
        select_paths: selectPaths,
        select_domains: selectDomains,
        exclude_paths: excludePaths,
        exclude_domains: excludeDomains,
        allow_external: allowExternal,
        include_images: includeImages,
        instructions,
        format,
        timeout,
        include_favicon: includeFavicon,
        include_usage: includeUsage,
        chunks_per_source: chunksPerSource,
        ...kwargs,
      },
      { timeoutSeconds: requestTimeout, headers: identityHeaders({ sessionId, humanId, clientName }) }
    );

    return {
      responseTime: data.response_time,
      baseUrl: data.base_url,
      results: data.results.map((item: any) => {
        return {
          url: item.url,
          rawContent: item.raw_content,
          images: item.images,
          favicon: item.favicon,
        };
      }),
      requestId: data.request_id,
      ...(data.usage !== undefined && { usage: data.usage }),
    };
  };
}
