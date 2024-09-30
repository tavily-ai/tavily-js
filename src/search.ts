import { TavilySearchOptions, TavilySearchFuncton, TavilyQNASearchFuncton, TavilyContextSearchFuncton} from "./types";
import { post, DEFAULT_MAX_TOKENS, getMaxTokensFromList } from "./utils";



export function _search(apiKey: string): TavilySearchFuncton {
  return async function search(
    query: string,
    options: TavilySearchOptions = {
      searchDepth: "basic",
      topic: "general",
      days: 3,
      maxResults: 5,
      includeImages: false,
      includeImageDescriptions: false,
      includeAnswer: false,
      includeRawContent: false,
      includeDomains: undefined,
      excludeDomains: undefined,
      maxTokens: undefined
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
      include_image_descriptions: options.includeImageDescriptions,
      include_answer: options.includeAnswer,
      include_raw_content: options.includeRawContent,
      include_domains: options.includeDomains,
      exclude_domains: options.excludeDomains,
    });

    return {
      query,
      responseTime: response.data.response_time,
      images: response.data.images.map((image: any) => {
        return {
          url: image?.url || image,
          description: image.description,
        };
      }),
      results: response.data.results.map((result: any) => {
        return {
          title: result.title,
          url: result.url,
          content: result.content,
          rawContent: result.raw_content,
          score: result.score,
          publishedDate: result.published_date,
        };
      }),
      answer: response.data.answer,
    };
  };
}

export function _searchQNA(apiKey: string):  TavilyQNASearchFuncton {
  return async function searchQNA(
    query: string,
    options: TavilySearchOptions = {
      searchDepth: "advanced",
      topic: "general",
      days: 3,
      maxResults: 5,
      includeImages: false,
      includeImageDescriptions: false,
      includeAnswer: false,
      includeRawContent: false,
      includeDomains: undefined,
      excludeDomains: undefined,
      maxTokens: undefined
    }
  ) {
    const response = await post("search", {
      api_key: apiKey,
      query,
      search_depth: options.searchDepth,
      topic: options.topic,
      days: options.days,
      max_results: options.maxResults,
      include_images: false,
      include_image_descriptions: false,
      include_answer: true,
      include_raw_content: false,
      include_domains: options.includeDomains,
      exclude_domains: options.excludeDomains,
    });

    const answer = response.data.answer;

    return answer;
  };
}

export function _searchContext(apiKey: string): TavilyContextSearchFuncton {
  return async function searchContext(
    query: string,
    options: TavilySearchOptions = {
      searchDepth: "basic",
      topic: "general",
      days: 3,
      maxResults: 5,
      includeImages: false,
      includeImageDescriptions: false,
      includeAnswer: false,
      includeRawContent: false,
      includeDomains: undefined,
      excludeDomains: undefined,
      maxTokens: DEFAULT_MAX_TOKENS
    }
  ) {
    const response = await post("search", {
      api_key: apiKey,
      query,
      search_depth: options.searchDepth,
      topic: options.topic,
      days: options.days,
      max_results: options.maxResults,
      include_images: false,
      include_image_descriptions: false,
      include_answer: false,
      include_raw_content: false,
      include_domains: options.includeDomains,
      exclude_domains: options.excludeDomains,
      max_tokens: options.maxTokens
    });

    const sources = response.data?.results || [];

    const context = sources.map((source: any) => {
      return {
        url: source.url,
        content: source.content
      }
    });

    return JSON.stringify(getMaxTokensFromList(context, options.maxTokens));

  };
}