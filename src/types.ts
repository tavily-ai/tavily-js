export type TavilyClient = {
  search: (query: string, options: SearchOptions) => Promise<any>;
  extract: (urls: Array<string>) => Promise<void>;
};

export type TavilyClientOptions = {
  apiKey?: string;
};

export type SearchOptions = {
  searchDepth?: "basic" | "advanced";
  topic?: "general" | "news" | "finance";
  days?: number;
  maxResults?: number;
  includeImages?: boolean;
  includeAnswer?: boolean;
  includeRawContent?: boolean;
  includeDomains?: undefined | Array<string>;
  excludeDomains?: undefined | Array<string>;
};