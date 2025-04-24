export type TavilySearchFuncton = (
  query: string,
  options: TavilySearchOptions
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
  options: TavilyExtractOptions
) => Promise<TavilyExtractResponse>;

export type TavilyCrawlFunction = (
  url: string,
  options: TavilyCrawlOptions
) => Promise<TavilyCrawlResponse>;

export type TavilyMapFunction = (
  url: string,
  options: TavilyMapOptions
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
  timeRange?: "year" | "month" | "week" | "day" | "y" | "m" | "w" | "d";
  chunksPerSource?: undefined | number;
  timeout?: number;
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
};

export type TavilySearchResponse = {
  answer?: string;
  query: string;
  responseTime: number;
  images: Array<TavilyImage>;
  results: Array<TavilySearchResult>;
};

export type TavilyExtractOptions = {
  includeImages?: boolean;
  extractDepth?: "basic" | "advanced";
  timeout?: number;
  [key: string]: any;
};

type TavilyExtractResult = {
  url: string;
  rawContent: string;
  images?: Array<string>;
};

type TavilyExtractFailedResult = {
  url: string;
  error: string;
};

export type TavilyCrawlCategory =
  | "Documentation"
  | "Blog"
  | "About"
  | "Contact"
  | "Pricing"
  | "Careers"
  | "E-Commerce"
  | "Developers"
  | "Partners"
  | "Downloads"
  | "Media"
  | "Events";

export type TavilyCrawlCategories = Set<TavilyCrawlCategory>;

export type TavilyExtractResponse = {
  results: Array<TavilyExtractResult>;
  failedResults: Array<TavilyExtractFailedResult>;
  responseTime: number;
};

export type TavilyCrawlOptions = {
  maxDepth: number;
  maxBreadth: number;
  limit: number;
  query: string;
  extractDepth: "basic" | "advanced";
  selectPaths: string[];
  selectDomains: string[];
  allowExternal: boolean;
  categories: TavilyCrawlCategory[];
  timeout: number;
  [key: string]: any;
};

export type TavilyCrawlResponse = {
  responseTime: number;
  baseUrl: string;
  results: Array<{
    url: string;
    rawContent: string;
    images: Array<string>;
  }>;
};

export type TavilyMapOptions = {
  limit: number;
  maxDepth: number;
  maxBreadth: number;
  selectPaths: string[];
  selectDomains: string[];
  categories: TavilyCrawlCategory[];
  allowExternal: boolean;
  query: string;
  timeout: number;
  [key: string]: any;
}

export type TavilyMapResponse = {
  responseTime: number;
  baseUrl: string;
  results: string[];
}