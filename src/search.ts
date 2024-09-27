import { SearchOptions } from "./types";
import { post } from "./utils";

export function _search(apiKey: string) {
  return async function search(
    query: string,
    options: SearchOptions = { max_results: 10 }
  ) {
    const response = await post("search", {
      api_key: apiKey,
      query,
      max_results: options.max_results,
    });

    return response.data;
  };
}
