export type TavilySearchFuncton = (
  query: string,
  options?: TavilySearchOptions
) => Promise<TavilySearchResponse>;

/**
 * @deprecated This function is deprecated and will be removed in a future version.
 * Use `search()` with `includeAnswer: true` instead, which returns the answer in the response.
 */
export type TavilyQNASearchFuncton = (
  query: string,
  options: TavilySearchOptions
) => Promise<string>;

/**
 * @deprecated This function is deprecated and will be removed in a future version.
 * Use `search()` directly and process the results as needed.
 */
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

export type TavilyResearchFunction = (
  input: string,
  options?: TavilyResearchOptions
) => Promise<TavilyResearchResponse | AsyncGenerator<Buffer, void, unknown>>;

export type TavilyGetResearchFunction = (
  requestId: string
) => Promise<
  TavilyGetResearchResponse | TavilyGetResearchIncompleteStatusResponse
>;

export type TavilyFeedbackFunction = (
  options: TavilyFeedbackOptions
) => Promise<TavilyFeedbackResponse>;

export type TavilyClient = {
  search: TavilySearchFuncton;
  /** @deprecated Use `search()` with `includeAnswer: true` instead */
  searchQNA: TavilyQNASearchFuncton;
  /** @deprecated Use `search()` directly and process results as needed */
  searchContext: TavilyContextSearchFuncton;
  extract: TavilyExtractFunction;
  crawl: TavilyCrawlFunction;
  map: TavilyMapFunction;
  research: TavilyResearchFunction;
  getResearch: TavilyGetResearchFunction;
  feedback: TavilyFeedbackFunction;
};

export type TavilyProxyOptions = {
  http?: string;
  https?: string;
};

export type TavilyClientOptions = {
  apiKey?: string;
  proxies?: TavilyProxyOptions;
  apiBaseURL?: string;
  clientSource?: string;
  projectId?: string;
  orgId?: string;
  sessionId?: string;
  humanId?: string;
  clientName?: string;
};

export type TavilyRequestConfig = {
  apiKey?: string;
  proxies?: TavilyProxyOptions;
  apiBaseURL?: string;
  clientSource?: string;
  projectId?: string;
  orgId?: string;
  sessionId?: string;
  humanId?: string;
  clientName?: string;
};

export type TavilySearchOptions = {
  searchDepth?: "basic" | "advanced" | "fast" | "ultra-fast";
  topic?: "general" | "news" | "finance";
  days?: number;
  maxResults?: number;
  includeImages?: boolean;
  includeImageDescriptions?: boolean;
  includeAnswer?: boolean | "basic" | "advanced";
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
  includeUsage?: boolean;
  exactMatch?: boolean;
  language?: string;
  filterByLanguage?: boolean;
  sessionId?: string;
  humanId?: string;
  clientName?: string;
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
  id: string;
};

export type TavilySearchResponse = {
  answer?: string;
  query: string;
  responseTime: number;
  images: Array<TavilyImage>;
  results: Array<TavilySearchResult>;
  autoParameters?: Partial<TavilySearchOptions>;
  favicon?: string;
  usage?: { credits: number };
  requestId: string;
};

export type TavilyExtractOptions = {
  includeImages?: boolean;
  extractDepth?: "basic" | "advanced";
  format?: "markdown" | "text";
  timeout?: number;
  includeFavicon?: boolean;
  includeUsage?: boolean;
  query?: string;
  chunksPerSource?: number;
  sessionId?: string;
  humanId?: string;
  clientName?: string;
  [key: string]: any;
};

type TavilyExtractResult = {
  url: string;
  title: string | null;
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
  usage?: { credits: number };
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
  includeUsage?: boolean;
  chunksPerSource?: number;
  sessionId?: string;
  humanId?: string;
  clientName?: string;
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
  usage?: { credits: number };
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
  includeUsage?: boolean;
  sessionId?: string;
  humanId?: string;
  clientName?: string;
  [key: string]: any;
};

export type TavilyMapResponse = {
  responseTime: number;
  baseUrl: string;
  results: string[];
  usage?: { credits: number };
  requestId: string;
};

export type TavilyResearchOptions = {
  model?: "mini" | "pro" | "auto";
  outputSchema?: Record<string, any>;
  stream?: boolean;
  citationFormat?: "numbered" | "mla" | "apa" | "chicago";
  timeout?: number;
  sessionId?: string;
  humanId?: string;
  clientName?: string;
  [key: string]: any;
};

export type TavilyResearchResponse = {
  requestId: string;
  createdAt: string;
  status: string;
  input: string;
  model: string;
  responseTime: number;
};

export type TavilyGetResearchResponse = {
  requestId: string;
  createdAt: string;
  status: string;
  content: string | Record<string, any>;
  sources: Array<{
    title: string;
    url: string;
  }>;
  responseTime: number;
};

export type TavilyGetResearchIncompleteStatusResponse = Pick<
  TavilyGetResearchResponse,
  "requestId" | "status" | "responseTime"
>;

export type TavilyFeedbackLabeledScore = {
  label: string;
  value: number | string;
};

export type TavilyFeedbackUrlScore = {
  id?: string;
  url?: string;
  agentScore?: number | string;
  scores?: Array<TavilyFeedbackLabeledScore>;
  comment?: string;
};

export type TavilyFeedbackOptions = {
  sessionId?: string;
  requestId?: string;
  agentScore?: number | string;
  humanScore?: number | string;
  extraScores?: Array<TavilyFeedbackLabeledScore>;
  comment?: string;
  responseDelivered?: string;
  usedUrls?: Array<string>;
  usedIds?: Array<string>;
  usedCitations?: Array<string>;
  urlsScores?: Array<TavilyFeedbackUrlScore>;
  timeout?: number;
  humanId?: string;
  clientName?: string;
  [key: string]: any;
};

export type TavilyFeedbackResponse = {
  success: boolean;
  feedbackId: string;
  responseTime: number;
};
