// A deliberately small JSON Schema vocabulary for Tavily's flat parameters.
// Keep this module dependency-free: client declarations also use these types.
export type ParameterDefinition = { readonly description: string } & (
  | { readonly type: "string" }
  | { readonly type: "boolean" }
  | { readonly type: "number" | "integer"; readonly minimum?: number; readonly maximum?: number }
  | { readonly type: "array"; readonly items: { readonly type: "string" } }
  | { readonly type: "string"; readonly enum: readonly [string, ...string[]] }
  | { readonly type: readonly ["boolean", "string"]; readonly enum: readonly [string | boolean, ...(string | boolean)[]] }
);

export type ParameterValue<T extends ParameterDefinition> =
  T extends { readonly enum: readonly (infer V)[] } ? V :
  T extends { readonly type: "string" } ? string :
  T extends { readonly type: "boolean" } ? boolean :
  T extends { readonly type: "array" } ? string[] : number;

/** Search request fields in SDK (camelCase) form. No defaults are injected. */
export const searchParameters = {
  query: { type: "string", description: "Web search query." },
  searchDepth: {
    type: "string",
    enum: ["basic", "advanced", "fast", "ultra-fast"],
    description: "Search strategy: basic for quick retrieval, advanced for deeper coverage, fast for lower latency, or ultra-fast for the lowest latency.",
  },
  topic: { type: "string", enum: ["general", "news", "finance"], description: "Search category." },
  days: { type: "number", description: "Lookback in days for news searches." },
  maxResults: { type: "integer", minimum: 0, maximum: 20, description: "Result count limit." },
  includeImages: { type: "boolean", description: "Request images alongside text results." },
  includeImageDescriptions: { type: "boolean", description: "Request descriptions for returned images." },
  includeAnswer: {
    type: ["boolean", "string"], enum: [false, true, "basic", "advanced"],
    description: "Request a generated answer; true selects the basic answer mode.",
  },
  includeRawContent: {
    type: ["boolean", "string"], enum: [false, "markdown", "text"],
    description: "Return page content in the selected format, or disable it with false.",
  },
  includeDomains: { type: "array", items: { type: "string" }, description: "Domains to include or prefer." },
  excludeDomains: { type: "array", items: { type: "string" }, description: "Domains to omit." },
  includeDomainsMode: { type: "string", enum: ["restrict", "prefer"], description: "How to apply includeDomains." },
  timeRange: {
    type: "string", enum: ["year", "month", "week", "day", "y", "m", "w", "d"],
    description: "Relative date window; single-letter aliases are accepted.",
  },
  chunksPerSource: { type: "integer", minimum: 1, maximum: 3, description: "Content chunks per source for advanced search." },
  country: { type: "string", description: "Country preference for results." },
  startDate: { type: "string", description: "Start of the date window (YYYY-MM-DD)." },
  endDate: { type: "string", description: "End of the date window (YYYY-MM-DD)." },
  maxAgeHours: { type: "number", description: "Maximum acceptable cache age in hours." },
  autoParameters: { type: "boolean", description: "Let Tavily choose search settings from the query." },
  includeFavicon: { type: "boolean", description: "Request site icons." },
  includeUsage: { type: "boolean", description: "Request credit usage details." },
  exactMatch: { type: "boolean", description: "Require exact matches for quoted phrases in the query." },
  fetchTimeout: { type: "number", description: "Live-fetch time budget in seconds." },
  cacheFallback: { type: "boolean", description: "Allow cached content when live fetching fails." },
  language: { type: "string", description: "Preferred content language." },
  filterByLanguage: { type: "boolean", description: "Restrict results to the requested language." },
  safeSearch: { type: "boolean", description: "Filter explicit content from results." },
  includePublishedDate: { type: "boolean", description: "Request detected publication dates." },
  filterByPublishedDate: {
    type: "boolean",
    description: "Exclude undated results and results outside the requested date window; also enables publication dates.",
  },
} as const satisfies Record<string, ParameterDefinition>;

export type SearchParameterValues = {
  -readonly [K in keyof typeof searchParameters]: ParameterValue<(typeof searchParameters)[K]>;
};

/** Explicit model-facing policy. SDK parameter additions do not extend this profile. */
export const searchAgentInputParams = {
  query: "required",
  searchDepth: "optional",
  timeRange: "optional",
  exactMatch: "optional",
} as const satisfies Partial<Record<keyof typeof searchParameters, "required" | "optional">>;

type AgentKey = keyof typeof searchAgentInputParams;

/** Draft 2020-12 schema for tool advertisement; contains only approved fields. */
export const searchAgentInputJsonSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  properties: Object.fromEntries(
    (Object.keys(searchAgentInputParams) as AgentKey[]).map(key => [key, searchParameters[key]])
  ) as Pick<typeof searchParameters, AgentKey>,
  required: (Object.keys(searchAgentInputParams) as AgentKey[]).filter(
    key => searchAgentInputParams[key] === "required"
  ),
  additionalProperties: false,
} as const;
