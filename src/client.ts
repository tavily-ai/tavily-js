import { TavilyClientOptions, TavilyClient } from "./types";
import { createTransport } from "./transport";
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
  const transport = createTransport(options);

  if (!(options.apiKey || process.env.TAVILY_API_KEY)) {
    return {
      search: _search(transport),
      extract: _extract(transport),
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
    search: _search(transport),
    extract: _extract(transport),
    crawl: _crawl(transport),
    map: _map(transport),
    research: _research(transport),
    getResearch: _getResearch(transport),
    feedback: _feedback(transport),
  };
}
