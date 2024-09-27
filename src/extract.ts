import { TavilyExtractFunction } from "./types";
import { post } from "./utils";

export function _extract(apiKey: string): TavilyExtractFunction {
  return async function extract(urls: Array<string>) {
    const response = await post("extract", {
      api_key: apiKey,
      urls,
    });

    return {
      responseTime: response.data.response_time,
      results: response.data.results.map((result: any) => {
        return {
          url: result.url,
          rawContent: result.raw_content,
        };
      }),
      failedResults: response.data.failed_results.map((result: any) => {
        return {
          url: result.url,
          error: result.error,
        };
      }),
    };
  };
}
