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
  includeImageDescriptions?: boolean;
  includeAnswer?: boolean;
  includeRawContent?: boolean;
  includeDomains?: undefined | Array<string>;
  excludeDomains?: undefined | Array<string>;
};

type TavilyImage = {
  url: string;
  description?: string;
};

type TavilyResult = {
  title: string;
  url: string;
  content: string;
  rawContent?: string;
  score: number;
  publishedDate: string;
};

export type TavilyResponse = {
  answer?: string;
  query: string;
  responseTime: number;
  images: Array<TavilyImage>;
  results: Array<TavilyResult>;
}