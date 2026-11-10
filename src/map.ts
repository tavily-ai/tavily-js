import {
  TavilyMapOptions,
  TavilyMapFunction,
  TavilyRequestConfig,
} from "./types";
import { createTransport } from "./transport";

export function _map(requestConfig: TavilyRequestConfig): TavilyMapFunction {
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

    const data: any = await createTransport(callConfig).post(
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
      { timeoutSeconds: requestTimeout }
    );

    return {
      responseTime: data.response_time,
      baseUrl: data.base_url,
      results: data.results,
      requestId: data.request_id,
      ...(data.usage !== undefined && { usage: data.usage }),
    };
  };
}
