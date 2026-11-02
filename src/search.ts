import { AxiosError, AxiosResponse } from "axios";
import {
  TavilySearchOptions,
  TavilySearchFuncton,
  TavilyRequestConfig,
} from "./types";
import {
  post,
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
      maxAgeHours,
      maxHours,
      autoParameters,
      timeout,
      includeFavicon,
      includeUsage,
      exactMatch,
      fetchTimeout,
      cacheFallback,
      language,
      filterByLanguage,
      safeSearch,
      includePublishedDate,
      filterByPublishedDate,
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
          max_age_hours: maxAgeHours ?? maxHours,
          auto_parameters: autoParameters,
          include_favicon: includeFavicon,
          include_usage: includeUsage,
          exact_match: exactMatch,
          fetch_timeout: fetchTimeout,
          cache_fallback: cacheFallback,
          language: language,
          filter_by_language: filterByLanguage,
          safe_search: safeSearch,
          include_published_date: includePublishedDate,
          filter_by_published_date: filterByPublishedDate,
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
            images: (Array.isArray(result.images) ? result.images : [])
              .map((image: any) => ({
                url: typeof image === "string" ? image : image?.url,
                description:
                  typeof image?.description === "string"
                    ? image.description
                    : undefined,
              }))
              .filter(({ url }: { url: unknown }) =>
                typeof url === "string" && url.trim().length > 0
              ),
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
