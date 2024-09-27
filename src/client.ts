import { TavilyClientOptions, TavilyClient } from "./types";
import { _search } from "./search";
import { _extract } from "./extract";

export function tavily(options?: TavilyClientOptions): TavilyClient {
  const apiKey = options?.apiKey || process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("No API key provided");
  }

  return {
    search: _search(apiKey),
    extract: _extract(apiKey),
  };
}
