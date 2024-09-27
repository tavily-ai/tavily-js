import { SearchOptions } from "./types";

export function search({ query, max_results }: SearchOptions): string {
  return `Searching for ${query} with a maximum of ${max_results} results`;
}
