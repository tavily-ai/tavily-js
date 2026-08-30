import { AxiosError, AxiosResponse } from "axios";
import {
  TavilySearchOptions,
  TavilySearchFuncton,
  TavilyQNASearchFuncton,
  TavilyContextSearchFuncton,
  TavilyRequestConfig,
} from "./types";
import {
  post,
  DEFAULT_MAX_TOKENS,
  getMaxTokensFromList,
  handleRequestError,
  handleTimeoutError,
} from "./utils";

export function _search(requestConfig: TavilyRequestConfig): TavilySearchFuncton {
  return async function search(
    query: string,
    options: Partial<TavilySearchOptions> = {}
  ) {
    const {
      searchDepth,
      topic,
      days,
      maxResults,
      includeImages,
      includeImageDescriptions,
      includeAnswer,
      includeRawContent,
      includeDomains,
      excludeDomains,
      includeDomainsMode,
      timeRange,
      chunksPerSource,
      country,
      startDate,
      endDate,
      autoParameters,
      timeout,
      includeFavicon,
      includeUsage,
      exactMatch,
      language,
      filterByLanguage,
      sessionId,
      humanId,
      clientName,
      ...kwargs
    } = options;

    const requestTimeout = timeout ?? 60; // Default to 60s
    const callConfig: TavilyRequestConfig = {
      ...requestConfig,
      ...(sessionId !== undefined && { sessionId }),
      ...(humanId !== undefined && { humanId }),
      ...(clientName !== undefined && { clientName }),
    };

    try {
      const response = await post(
        "search",
        {
          query,
          search_depth: searchDepth,
          topic: topic,
          days: days,
          max_results: maxResults,
          include_images: includeImages,
          include_image_descriptions: includeImageDescriptions,
          include_answer: includeAnswer,
          include_raw_content: includeRawContent,
          include_domains: includeDomains,
          exclude_domains: excludeDomains,
          include_domains_mode: includeDomainsMode,
          time_range: timeRange,
          chunks_per_source: chunksPerSource,
          country: country,
          start_date: startDate,
          end_date: endDate,
          auto_parameters: autoParameters,
          include_favicon: includeFavicon,
          include_usage: includeUsage,
          exact_match: exactMatch,
          language: language,
          filter_by_language: filterByLanguage,
          ...kwargs,
        },
        callConfig,
        requestTimeout
      );

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
            favicon: result.favicon,
            id: result.id,
          };
        }),
        answer: response.data.answer,
        requestId: response.data.request_id,
        ...(response.data.usage !== undefined && { usage: response.data.usage }),
        ...(response.data.auto_parameters && {
          autoParameters: {
            includeDomains: response.data.auto_parameters?.include_domains,
            excludeDomains: response.data.auto_parameters?.exclude_domains,
            topic: response.data.auto_parameters?.topic,
            timeRange: response.data.auto_parameters?.time_range,
            searchDepth: response.data.auto_parameters?.search_depth,
          },
        }),
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

/**
 * @deprecated This function is deprecated and will be removed in a future version.
 * Use `search()` with `includeAnswer: true` instead:
 * 
 * @example
 * const result = await client.search(query, { includeAnswer: true });
 * const answer = result.answer;
 */
export function _searchQNA(requestConfig: TavilyRequestConfig): TavilyQNASearchFuncton {
  return async function searchQNA(
    query: string,
    options: TavilySearchOptions = {}
  ) {
    console.warn(
      "searchQNA() is deprecated and will be removed in a future version. " +
      "Use search() with includeAnswer: true instead."
    );
    
    const requestTimeout = options?.timeout ?? 60; // Default to 60s

    try {
      const response = await post(
        "search",
        {
          query,
          search_depth: options.searchDepth ?? "advanced",
          topic: options.topic,
          days: options.days,
          max_results: options.maxResults,
          include_answer: true,
          include_domains: options.includeDomains,
          exclude_domains: options.excludeDomains,
          chunks_per_source: options.chunksPerSource,
          include_favicon: options.includeFavicon,
        },
        requestConfig,
        requestTimeout
      );

      const answer = response.data.answer;

      return answer;
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

/**
 * @deprecated This function is deprecated and will be removed in a future version.
 * Use `search()` directly and process the results as needed:
 * 
 * @example
 * const result = await client.search(query, options);
 * const context = result.results.map(r => ({ url: r.url, content: r.content }));
 */
export function _searchContext(requestConfig: TavilyRequestConfig): TavilyContextSearchFuncton {
  return async function searchContext(
    query: string,
    options: TavilySearchOptions = {}
  ) {
    console.warn(
      "searchContext() is deprecated and will be removed in a future version. " +
      "Use search() directly and process the results as needed."
    );
    
    const timeout = options?.timeout ?? 60; // Default to 60s

    try {
      const response = await post(
        "search",
        {
          query,
          search_depth: options.searchDepth,
          topic: options.topic,
          days: options.days,
          max_results: options.maxResults,
          include_domains: options.includeDomains,
          exclude_domains: options.excludeDomains,
          chunks_per_source: options.chunksPerSource,
          include_favicon: options.includeFavicon,
        },
        requestConfig,
        timeout
      );

      const sources = response.data?.results || [];

      const context = sources.map((source: any) => {
        return {
          url: source.url,
          content: source.content,
        };
      });

      return JSON.stringify(
        getMaxTokensFromList(context, options.maxTokens ?? DEFAULT_MAX_TOKENS)
      );
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.code === "ECONNABORTED") {
          handleTimeoutError(timeout);
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
