import {
  TavilyMapOptions,
  TavilyMapFunction,
  TavilyProxyOptions,
} from "./types";
import { post, handleRequestError, handleTimeoutError } from "./utils";
import { AxiosError, AxiosResponse } from "axios";

export function _map(
  apiKey: string,
  proxies?: TavilyProxyOptions,
  apiBaseURL?: string
): TavilyMapFunction {
  return async function map(
    url: string,
    options: Partial<TavilyMapOptions> = {}
  ) {
    const {
      maxDepth,
      maxBreadth,
      limit,
      selectPaths,
      selectDomains,
      excludePaths,
      excludeDomains,
      allowExternal,
      instructions,
      timeout,
      includeUsage,
      ...kwargs
    } = options;

    const requestTimeout = timeout ?? 150; // Default to 150s

    try {
      const response = await post(
        "map",
        {
          url: url,
          max_depth: maxDepth,
          max_breadth: maxBreadth,
          limit,
          select_paths: selectPaths,
          select_domains: selectDomains,
          exclude_paths: excludePaths,
          exclude_domains: excludeDomains,
          allow_external: allowExternal,
          instructions,
          timeout,
          include_usage: includeUsage,
          ...kwargs,
        },
        apiKey,
        proxies,
        requestTimeout,
        apiBaseURL
      );

      return {
        responseTime: response.data.response_time,
        baseUrl: response.data.base_url,
        results: response.data.results,
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
