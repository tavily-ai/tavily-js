import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "node:http";
import { once } from "node:events";
import { tavily } from "../dist/index.mjs";
import { z } from "zod/v4";
import { searchAgentInputSchema, searchParameterSchemas } from "../dist/agent-schemas.mjs";
import { searchAgentInputJsonSchema, searchAgentInputParams, searchParameters } from "../dist/parameters.mjs";

// Exercise the public client and Axios JSON serialization against loopback only.
for (const key of ["TAVILY_HTTP_PROXY", "TAVILY_HTTPS_PROXY"]) delete process.env[key];
process.env.NO_PROXY = "127.0.0.1";
const requests = [];
const server = createServer(async (req, res) => {
  let body = "";
  for await (const chunk of req) body += chunk;
  requests.push({ body: JSON.parse(body), headers: req.headers, path: req.url });
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({
    images: [],
    results: [{ title: "Test", url: "https://example.com", content: "Test content", score: 1 }],
    answer: "Test answer", response_time: 0, request_id: "offline-test",
  }));
});
let client;
before(async () => {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  client = tavily({ apiKey: "offline-test", apiBaseURL: `http://127.0.0.1:${server.address().port}` });
});
after(() => new Promise(resolve => server.close(resolve)));

test("Search sends the new booleans with API names, preserving true, false and omission", async () => {
  for (const value of [true, false, undefined]) {
    await client.search("test", { safeSearch: value, includePublishedDate: value, filterByPublishedDate: value });
    assert.deepEqual(requests.at(-1).body, value === undefined ? { query: "test" } : {
      query: "test", safe_search: value, include_published_date: value, filter_by_published_date: value,
    });
    assert.equal(requests.at(-1).path, "/search");
  }
  await client.search("test");
  assert.deepEqual(requests.at(-1).body, { query: "test" });
});

test("Search retains extras, snake_case precedence, aliases, zero and per-call headers", async () => {
  await client.search("test", {
    searchDepth: "ultra-fast", timeRange: "d", maxResults: 0, exactMatch: false,
    safeSearch: true, safe_search: false,
    includePublishedDate: true, include_published_date: false,
    filterByPublishedDate: true, filter_by_published_date: false,
    maxAgeHours: 0, maxHours: 12,
    timeout: 5, sessionId: "session-test", humanId: "human-test", clientName: "client-test",
    future_option: { enabled: false },
  });
  const request = requests.at(-1);
  assert.deepEqual(request.body, {
    query: "test", search_depth: "ultra-fast", time_range: "d", max_results: 0,
    exact_match: false, safe_search: false, include_published_date: false,
    filter_by_published_date: false, max_age_hours: 0,
    future_option: { enabled: false },
  });
  assert.equal(request.headers["x-session-id"], "session-test");
  assert.equal(request.headers["x-human-id"], "human-test");
  assert.equal(request.headers["x-client-name"], "client-test");
  await client.search("test", { maxHours: 12, safe_search: true });
  assert.deepEqual(requests.at(-1).body, { query: "test", max_age_hours: 12, safe_search: true });
});

test("Search serializes every declared request field without changing options", async () => {
  const options = Object.freeze({
    searchDepth: "advanced", topic: "news", days: 3, maxResults: 5,
    includeImages: true, includeImageDescriptions: true, includeAnswer: "advanced",
    includeRawContent: "markdown", includeDomains: ["example.com"], excludeDomains: ["blocked.com"],
    includeDomainsMode: "prefer", timeRange: "week", chunksPerSource: 2, country: "united states",
    startDate: "2026-01-01", endDate: "2026-01-31", maxAgeHours: 24, autoParameters: false,
    includeFavicon: true, includeUsage: true, exactMatch: false, fetchTimeout: 10,
    cacheFallback: false, language: "english", filterByLanguage: true, safeSearch: false,
    includePublishedDate: true, filterByPublishedDate: false,
  });
  assert.deepEqual(Object.keys(searchParameters).sort(), ["query", ...Object.keys(options)].sort());
  await client.search("test", options);
  assert.deepEqual(requests.at(-1).body, {
    query: "test", search_depth: "advanced", topic: "news", days: 3, max_results: 5,
    include_images: true, include_image_descriptions: true, include_answer: "advanced",
    include_raw_content: "markdown", include_domains: ["example.com"], exclude_domains: ["blocked.com"],
    include_domains_mode: "prefer", time_range: "week", chunks_per_source: 2, country: "united states",
    start_date: "2026-01-01", end_date: "2026-01-31", max_age_hours: 24, auto_parameters: false,
    include_favicon: true, include_usage: true, exact_match: false, fetch_timeout: 10,
    cache_fallback: false, language: "english", filter_by_language: true, safe_search: false,
    include_published_date: true, filter_by_published_date: false,
  });
});

test("Search preserves raw overrides independently of order and leaves unknown keys untouched", async () => {
  for (const options of [
    { safe_search: false, safeSearch: true },
    { safeSearch: true, safe_search: false },
  ]) {
    await client.search("test", { ...options, futureCamelCase: { keepThisKey: true } });
    assert.deepEqual(requests.at(-1).body, {
      query: "test", safe_search: false, futureCamelCase: { keepThisKey: true },
    });
  }
  await client.search("test", { safeSearch: true, safe_search: undefined });
  assert.deepEqual(requests.at(-1).body, { query: "test" });
  await client.search("test", { maxAgeHours: null, maxHours: 12 });
  assert.deepEqual(requests.at(-1).body, { query: "test", max_age_hours: 12 });
  await client.search("test", { maxHours: 12, max_age_hours: 0 });
  assert.deepEqual(requests.at(-1).body, { query: "test", max_age_hours: 0 });
});

test("agent advertisement contains exactly the approved profile and no defaults", () => {
  const approved = ["query", "searchDepth", "timeRange", "exactMatch"];
  assert.deepEqual(Object.keys(searchAgentInputParams), approved);
  assert.deepEqual(Object.keys(searchAgentInputSchema.shape), approved);
  assert.deepEqual(Object.keys(searchAgentInputJsonSchema.properties), approved);
  assert.deepEqual(searchAgentInputJsonSchema.required, ["query"]);
  assert.deepEqual(z.toJSONSchema(searchAgentInputSchema), searchAgentInputJsonSchema);
  assert.deepEqual(searchAgentInputSchema.parse({ query: "test" }), { query: "test" });
  assert.deepEqual(searchAgentInputSchema.parse({ query: "test", safeSearch: true }), { query: "test" });
  assert.deepEqual(
    searchAgentInputSchema.parse({ query: "test", searchDepth: null, timeRange: null, exactMatch: null }),
    { query: "test", searchDepth: undefined, timeRange: undefined, exactMatch: undefined }
  );
  for (const input of [{}, { query: 1 }, { query: null }, { query: "test", searchDepth: "deep" },
    { query: "test", timeRange: "hour" }, { query: "test", exactMatch: "false" }]) {
    assert.equal(searchAgentInputSchema.safeParse(input).success, false);
  }
});

test("all existing depth and time aliases remain valid in both shared surfaces", () => {
  for (const searchDepth of ["basic", "advanced", "fast", "ultra-fast"]) {
    assert.equal(searchAgentInputSchema.parse({ query: "test", searchDepth }).searchDepth, searchDepth);
    assert.ok(searchAgentInputJsonSchema.properties.searchDepth.enum.includes(searchDepth));
  }
  for (const timeRange of ["year", "month", "week", "day", "y", "m", "w", "d"]) {
    assert.equal(searchAgentInputSchema.parse({ query: "test", timeRange }).timeRange, timeRange);
    assert.ok(searchAgentInputJsonSchema.properties.timeRange.enum.includes(timeRange));
  }
});

test("shared validators reuse descriptions, enum choices and numeric constraints", () => {
  for (const [key, definition] of Object.entries(searchParameters)) {
    const schema = searchParameterSchemas[key];
    assert.equal(schema.description, definition.description);
    if (definition.enum) for (const value of definition.enum) assert.equal(schema.parse(value), value);
  }
  assert.equal(searchParameterSchemas.safeSearch.parse(false), false);
  assert.deepEqual(searchParameterSchemas.includeDomains.parse(["example.com"]), ["example.com"]);
  assert.equal(searchParameterSchemas.includeDomains.safeParse([1]).success, false);
  assert.equal(searchParameterSchemas.includeRawContent.safeParse(true).success, false);
  for (const value of [-1, 21, 1.5]) assert.equal(searchParameterSchemas.maxResults.safeParse(value).success, false);
  for (const value of [0, 20]) assert.equal(searchParameterSchemas.maxResults.parse(value), value);
  for (const value of [0, 4, 1.5]) assert.equal(searchParameterSchemas.chunksPerSource.safeParse(value).success, false);
});

test("wrapper composition preserves developer defaults and allows explicit false", async () => {
  const defaults = { searchDepth: "advanced", timeRange: "month", exactMatch: true, safeSearch: true };
  for (const input of [{ query: "test" }, { query: "test", searchDepth: undefined },
    { query: "test", searchDepth: null, timeRange: null, exactMatch: null },
    { query: "test", searchDepth: null, timeRange: null, exactMatch: false }]) {
    const { query, ...overrides } = searchAgentInputSchema.parse(input);
    const definedOverrides = Object.fromEntries(Object.entries(overrides).filter(([, value]) => value !== undefined));
    await client.search(query, { ...defaults, ...definedOverrides });
    assert.deepEqual(requests.at(-1).body, {
      query: "test", search_depth: "advanced", time_range: "month",
      exact_match: input.exactMatch === false ? false : true, safe_search: true,
    });
  }
  const { query, ...options } = searchAgentInputSchema.parse({
    query: "test", searchDepth: null, timeRange: null, exactMatch: null,
  });
  await client.search(query, options);
  assert.deepEqual(requests.at(-1).body, { query: "test" });
});

test("Search supplies answers and context for migrated callers", async () => {
  const result = await client.search("test", { searchDepth: "advanced", includeAnswer: true });
  assert.deepEqual(requests.at(-1).body, {
    query: "test", search_depth: "advanced", include_answer: true,
  });
  assert.equal(result.answer, "Test answer");
  const context = JSON.stringify(result.results.map(({ url, content }) => ({ url, content })));
  assert.deepEqual(JSON.parse(context), [{ url: "https://example.com", content: "Test content" }]);
});
