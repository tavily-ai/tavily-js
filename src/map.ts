import {
  TavilyMapOptions,
  TavilyMapFunction,
} from "./types";
import { TavilyTransport } from "./transport";
import { identityHeaders } from "./headers";

type RawMap = {
  response_time: number;
  base_url: string;
  results: string[];
  request_id: string;
  usage?: { credits: number };
};

export function _map(transport: TavilyTransport): TavilyMapFunction {
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

    const data = await transport.post<RawMap>(
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
      { timeoutSeconds: requestTimeout, headers: identityHeaders({ sessionId, humanId, clientName }) }
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
