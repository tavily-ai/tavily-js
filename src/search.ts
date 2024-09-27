import { SearchOptions } from "./types";
import { post } from "./utils";

export function _search(apiKey: string) {
  return async function search(
    query: string,
    options: SearchOptions = { 
      searchDepth: "basic",
      topic: "general",
      days: 3,
      maxResults: 5,
      includeImages: false,
      includeAnswer: false,
      includeRawContent: false,
      includeDomains: undefined,
      excludeDomains: undefined
     }
  ) {
    const response = await post("search", {
      api_key: apiKey,
      query,
      search_depth: options.searchDepth,
      topic: options.topic,
      days: options.days,
      max_results: options.maxResults,
      include_images: options.includeImages,
      include_answer: options.includeAnswer,
      include_raw_content: options.includeRawContent,
      include_domains: options.includeDomains,
      exclude_domains: options.excludeDomains
    });

    return response.data;
  };
}
