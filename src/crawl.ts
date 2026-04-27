import {
  TavilyCrawlOptions,
  TavilyCrawlFunction,
  TavilyRequestConfig,
} from "./types";
import { post, handleRequestError, handleTimeoutError } from "./utils";
import { AxiosError, AxiosResponse } from "axios";

export function _crawl(requestConfig: TavilyRequestConfig): TavilyCrawlFunction {
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
    const callConfig: TavilyRequestConfig = {
      ...requestConfig,
      ...(sessionId !== undefined && { sessionId }),
      ...(humanId !== undefined && { humanId }),
      ...(clientName !== undefined && { clientName }),
    };

    try {
      const response = await post(
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
        callConfig,
        requestTimeout
      );

      return {
        responseTime: response.data.response_time,
        baseUrl: response.data.base_url,
        results: response.data.results.map((item: any) => {
          return {
            url: item.url,
            rawContent: item.raw_content,
            images: item.images,
            favicon: item.favicon,
          };
        }),
        requestId: response.data.request_id,
        ...(response.data.usage !== undefined && { usage: response.data.usage }),
      };
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.code === "ECONNABORTED") {
          handleTimeoutError(requestTimeout);
        }
        if (err.response) {
          handleRequestError(err.response as AxiosResponse);
        }
      }
      throw new Error(
        `An unexpected error occurred while making the request. Error: ${err}`
      );
    }
  };
}
