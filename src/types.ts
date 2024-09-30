export type TavilySearchFuncton = (query: string, options: TavilySearchOptions) => Promise<TavilySearchResponse>;

export type TavilyQNASearchFuncton = (query: string, options: TavilySearchOptions) => Promise<string>;

export type TavilyContextSearchFuncton = (query: string, options: TavilySearchOptions) => Promise<string>;

export type TavilyExtractFunction = (urls: Array<string>) => Promise<TavilyExtractResponse>;

export type TavilyClient = {
  search: TavilySearchFuncton;
  searchQNA: TavilyQNASearchFuncton;
  searchContext: TavilyContextSearchFuncton;
  extract: TavilyExtractFunction;
};

export type TavilyClientOptions = {
  apiKey?: string;
};

export type TavilySearchOptions = {
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
  maxTokens?: undefined | number;
};

type TavilyImage = {
  url: string;
  description?: string;
};

type TavilySearchResult = {
  title: string;
  url: string;
  content: string;
  rawContent?: string;
  score: number;
  publishedDate: string;
};

export type TavilySearchResponse = {
  answer?: string;
  query: string;
  responseTime: number;
  images: Array<TavilyImage>;
  results: Array<TavilySearchResult>;
};

type TavilyExtractResult = {
  url: string;
  rawContent: string;
};

type TavilyExtractFailedResult = {
  url: string;
  error: string;
};

export type TavilyExtractResponse = {
  results: Array<TavilyExtractResult>;
  failedResults: Array<TavilyExtractFailedResult>;
  responseTime: number;
};