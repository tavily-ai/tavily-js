import {
  TavilyMapOptions,
  TavilyMapFunction,
  TavilyProxyOptions,
} from "./types";
import { post, handleRequestError } from "./utils";
import { AxiosError, AxiosResponse } from "axios";

export function _map(
  apiKey: string,
  proxies?: TavilyProxyOptions
): TavilyMapFunction {
  return async function map(
    url: string,
    options: Partial<TavilyMapOptions> = {}
  ) {
    try {
      const response = await post(
        "map",
        {
          url: url,
          max_depth: options.maxDepth,
          max_breadth: options.maxBreadth,
          limit: options.limit,
          select_paths: options.selectPaths,
          select_domains: options.selectDomains,
          allow_external: options.allowExternal,
          categories: options.categories,
          query: options.query,
        },
        apiKey,
        proxies,
        options.timeout ? Math.min(options.timeout, 120) : 60
      );

      return {
        responseTime: response.data.response_time,
        baseUrl: response.data.base_url,
        results: response.data.results,
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
