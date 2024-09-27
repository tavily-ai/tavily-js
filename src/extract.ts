import { post } from "./utils";

export function _extract(apiKey: string) {
  return async function extract(
    urls: Array<string>,
  ) {
    const response = await post("extract", {
      api_key: apiKey,
      urls
    });

    return response.data;
  };
}