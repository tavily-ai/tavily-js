import { TavilyClientOptions, TavilyClient, TavilyRequestConfig } from "./types";
import { _search } from "./search";
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

export function tavily(options: TavilyClientOptions = {}): TavilyClient {
  const requestConfig: TavilyRequestConfig = {
    ...options,
    apiKey: options.apiKey || process.env.TAVILY_API_KEY,
  };

  if (!requestConfig.apiKey) {
    return {
      search: _search(requestConfig),
      extract: _extract(requestConfig),
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
    crawl: _crawl(requestConfig),
    map: _map(requestConfig),
    research: _research(requestConfig),
    getResearch: _getResearch(requestConfig),
    feedback: _feedback(requestConfig),
  };
}
