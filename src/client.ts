import { TavilyClientOptions, TavilyClient, TavilyProxyOptions, TavilyRequestConfig } from "./types";
import { _search, _searchQNA, _searchContext } from "./search";
import { _extract } from "./extract";
import { _crawl } from "./crawl";
import { _map } from "./map";
import { _research, _getResearch } from "./research";

export function tavily(options?: TavilyClientOptions): TavilyClient {
  const apiKey = options?.apiKey || process.env.TAVILY_API_KEY;
  const proxies = (() => {
    const http = options?.proxies?.http || process.env.TAVILY_HTTP_PROXY;
    const https = options?.proxies?.https || process.env.TAVILY_HTTPS_PROXY;

    const result = {} as TavilyProxyOptions;

    if (http) result.http = http;
    if (https) result.https = https;

    return Object.keys(result).length > 0 ? result : undefined;
  })();

  if (!apiKey) {
    throw new Error(
      "No API key provided. Please provide the api_key attribute or set the TAVILY_API_KEY environment variable."
    );
  }

  const requestConfig: TavilyRequestConfig = {
    apiKey,
    proxies,
    apiBaseURL: options?.apiBaseURL,
    clientSource: options?.clientSource,
    projectId: options?.projectId || process.env.TAVILY_PROJECT,
  };

  return {
    search: _search(requestConfig),
    extract: _extract(requestConfig),
    searchQNA: _searchQNA(requestConfig),
    searchContext: _searchContext(requestConfig),
    crawl: _crawl(requestConfig),
    map: _map(requestConfig),
    research: _research(requestConfig),
    getResearch: _getResearch(requestConfig),
  };
}
