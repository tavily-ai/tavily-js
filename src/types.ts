export type TavilySearchFuncton = (
  query: string,
  options?: TavilySearchOptions
) => Promise<TavilySearchResponse>;

export type TavilyQNASearchFuncton = (
  query: string,
  options: TavilySearchOptions
) => Promise<string>;

export type TavilyContextSearchFuncton = (
  query: string,
  options: TavilySearchOptions
) => Promise<string>;

export type TavilyExtractFunction = (
  urls: Array<string>,
  options?: TavilyExtractOptions
) => Promise<TavilyExtractResponse>;

export type TavilyCrawlFunction = (
  url: string,
  options?: TavilyCrawlOptions
) => Promise<TavilyCrawlResponse>;

export type TavilyMapFunction = (
  url: string,
  options?: TavilyMapOptions
) => Promise<TavilyMapResponse>;

export type TavilyClient = {
  search: TavilySearchFuncton;
  searchQNA: TavilyQNASearchFuncton;
  searchContext: TavilyContextSearchFuncton;
  extract: TavilyExtractFunction;
  crawl: TavilyCrawlFunction;
  map: TavilyMapFunction;
};

export type TavilyProxyOptions = {
  http?: string;
  https?: string;
};

export type TavilyClientOptions = {
  apiKey?: string;
  proxies?: TavilyProxyOptions;
  apiBaseURL?: string;
};

export type TavilySearchOptions = {
  searchDepth?: "basic" | "advanced";
  topic?: "general" | "news" | "finance";
  days?: number;
  maxResults?: number;
  includeImages?: boolean;
  includeImageDescriptions?: boolean;
  includeAnswer?: boolean;
  includeRawContent?: false | "markdown" | "text";
  includeDomains?: string[];
  excludeDomains?: string[];
  maxTokens?: number;
  timeRange?: "year" | "month" | "week" | "day" | "y" | "m" | "w" | "d";
  chunksPerSource?: number;
  country?: string;
  startDate?: string;
  endDate?: string;
  autoParameters?: boolean;
  timeout?: number;
  includeFavicon?: boolean;
  [key: string]: any;
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
  favicon?: string;
};

export type TavilySearchResponse = {
  answer?: string;
  query: string;
  responseTime: number;
  images: Array<TavilyImage>;
  results: Array<TavilySearchResult>;
  autoParameters?: Partial<TavilySearchOptions>;
  requestId: string;
};

export type TavilyExtractOptions = {
  includeImages?: boolean;
  extractDepth?: "basic" | "advanced";
  format?: "markdown" | "text";
  timeout?: number;
  includeFavicon?: boolean;
  [key: string]: any;
};

type TavilyExtractResult = {
  url: string;
  rawContent: string;
  images?: Array<string>;
  favicon?: string;
};

type TavilyExtractFailedResult = {
  url: string;
  error: string;
};


export type TavilyExtractResponse = {
  results: Array<TavilyExtractResult>;
  failedResults: Array<TavilyExtractFailedResult>;
  responseTime: number;
  requestId: string;
};

export type TavilyCrawlOptions = {
  maxDepth?: number;
  maxBreadth?: number;
  limit?: number;
  instructions?: string;
  extractDepth?: "basic" | "advanced";
  selectPaths?: string[];
  selectDomains?: string[];
  excludePaths?: string[];
  excludeDomains?: string[];
  allowExternal?: boolean;
  includeImages?: boolean;
  format?: "markdown" | "text";
  timeout?: number;
  includeFavicon?: boolean;
  [key: string]: any;
};

export type TavilyCrawlResponse = {
  responseTime: number;
  baseUrl: string;
  results: Array<{
    url: string;
    rawContent: string;
    images: Array<string>;
    favicon?: string;
  }>;
  requestId: string;
};

export type TavilyMapOptions = {
  limit?: number;
  maxDepth?: number;
  maxBreadth?: number;
  selectPaths?: string[];
  selectDomains?: string[];
  excludePaths?: string[];
  excludeDomains?: string[];
  allowExternal?: boolean;
  instructions?: string;
  timeout?: number;
  [key: string]: any;
};

export type TavilyMapResponse = {
  responseTime: number;
  baseUrl: string;
  results: string[];
  requestId: string;
};
