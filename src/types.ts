export type TavilyClient = {
  search: (query: string, options: SearchOptions) => Promise<any>;
  extract: (urls: Array<string>) => Promise<void>;
};

export type TavilyClientOptions = {
  apiKey?: string;
};

export type SearchOptions = {
  max_results: number;
};