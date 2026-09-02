import { TavilyClientOptions, TavilyClient, TavilyProxyOptions, TavilyRequestConfig } from "./types";
import { _search, _searchQNA, _searchContext } from "./search";
import { _extract } from "./extract";
import { _crawl } from "./crawl";
import { _map } from "./map";
import { _research, _getResearch } from "./research";
import { _feedback } from "./feedback";

const KEYLESS_UNSUPPORTED_MESSAGE =
  "Keyless mode only supports search and extract; provide an API key to use this method.";
function makeKeylessUnsupported(methodName: string): (...args: any[]) => never {
  return (..._args: any[]): never => {
    throw new Error(`${methodName}: ${KEYLESS_UNSUPPORTED_MESSAGE}`);
  };
}

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

  const requestConfig: TavilyRequestConfig = {
    ...(apiKey ? { apiKey } : {}),
    proxies,
    apiBaseURL: options?.apiBaseURL,
    clientSource: options?.clientSource,
    projectId: options?.projectId || process.env.TAVILY_PROJECT,
    orgId: options?.orgId || process.env.TAVILY_ORG_ID,
    sessionId: options?.sessionId,
    humanId: options?.humanId,
    clientName: options?.clientName,
  };

  if (!apiKey) {
    return {
      search: _search(requestConfig),
      extract: _extract(requestConfig),
      searchQNA: makeKeylessUnsupported("searchQNA") as TavilyClient["searchQNA"],
      searchContext: makeKeylessUnsupported(
        "searchContext"
      ) as TavilyClient["searchContext"],
      crawl: makeKeylessUnsupported("crawl") as TavilyClient["crawl"],
      map: makeKeylessUnsupported("map") as TavilyClient["map"],
      research: makeKeylessUnsupported("research") as TavilyClient["research"],
      getResearch: makeKeylessUnsupported(
        "getResearch"
      ) as TavilyClient["getResearch"],
      feedback: makeKeylessUnsupported("feedback") as TavilyClient["feedback"],
    };
  }

  return {
    search: _search(requestConfig),
    extract: _extract(requestConfig),
    searchQNA: _searchQNA(requestConfig),
    searchContext: _searchContext(requestConfig),
    crawl: _crawl(requestConfig),
    map: _map(requestConfig),
    research: _research(requestConfig),
    getResearch: _getResearch(requestConfig),
    feedback: _feedback(requestConfig),
  };
}
