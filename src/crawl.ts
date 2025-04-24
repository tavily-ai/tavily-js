import {
  TavilyCrawlOptions,
  TavilyCrawlFunction,
  TavilyProxyOptions,
} from "./types";
import { post, handleRequestError } from "./utils";
import { AxiosError, AxiosResponse } from "axios";

export function _crawl(
  apiKey: string,
  proxies?: TavilyProxyOptions
): TavilyCrawlFunction {
  return async function crawl(
    url: string,
    options: Partial<TavilyCrawlOptions> = {}
  ) {

    try {
      const response = await post(
        "crawl",
        {
          url: url,
          max_depth: options.maxDepth,
          max_breadth: options.maxBreadth,
          limit: options.limit,
          extract_depth: options.extractDepth,
          select_paths: options.selectPaths,
          select_domains: options.selectDomains,
          allow_external: options.allowExternal,
          categories: options.categories,
          query: options.query,
        },
        apiKey,
        proxies,
        options?.timeout ? Math.min(options.timeout, 120) : 60 // Max 120s, default to 60
      );

      return {
        responseTime: response.data.response_time,
        baseUrl: response.data.base_url,
        results: response.data.results.map((item: any) => {
          return {
            url: item.url,
            rawContent: item.raw_content,
            images: item.images,
          };
        }),
      };
    } catch (err) {
      if (err instanceof AxiosError && err.response) {
        handleRequestError(err.response as AxiosResponse);
      } else {
        throw new Error(
          `An unexpected error occurred while making the request. Error: ${err}`
        );
      }
    }
  };
}
