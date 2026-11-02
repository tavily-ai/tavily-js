import { AxiosError, AxiosResponse } from "axios";
import { searchParameters } from "./parameters";
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

// Map declared Search fields only; explicit API names and unknown extras win.
function serializeSearchParameters(parameters: Record<string, unknown>) {
  const extras = { ...parameters };
  const body: Record<string, unknown> = {};
  for (const name of Object.keys(searchParameters)) {
    const apiName = name.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    body[apiName] = parameters[name];
    delete extras[name];
  }
  return { ...body, ...extras };
}

export function _search(requestConfig: TavilyRequestConfig): TavilySearchFuncton {
  return async function search(
    query: string,
    options: Partial<TavilySearchOptions> = {}
  ) {
    const { maxHours, timeout, sessionId, humanId, clientName, ...parameters } = options;

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
        serializeSearchParameters({
          query,
          ...parameters,
          maxAgeHours: parameters.maxAgeHours ?? maxHours,
        }),
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
