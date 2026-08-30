// Live tests for the `includeDomainsMode` search option (boosted domains).
//
// These hit the real Tavily API (no mocking) to confirm the option is
// accepted end-to-end. Requires a real TAVILY_API_KEY in the environment;
// run with:
//
//   npm run build && node --test tests/include-domains-mode.live.test.mjs
//
// Skipped automatically if TAVILY_API_KEY is not set.

import { test } from "node:test";
import assert from "node:assert/strict";
import { tavily } from "../dist/index.js";

const apiKey = process.env.TAVILY_API_KEY;
const skip = !apiKey;

test("search with includeDomainsMode boost returns results", { skip }, async () => {
  const client = tavily({ apiKey });
  const response = await client.search("quarterly earnings outlook", {
    includeDomains: ["bloomberg.com", "reuters.com"],
    includeDomainsMode: "boost",
  });
  assert.ok(Array.isArray(response.results));
  assert.ok(response.results.length > 0);
});

test("search with includeDomainsMode filter restricts to listed domains", { skip }, async () => {
  const client = tavily({ apiKey });
  const response = await client.search("CEO background at Google", {
    includeDomains: ["linkedin.com"],
    includeDomainsMode: "filter",
  });
  assert.ok(Array.isArray(response.results));
  for (const result of response.results) {
    const host = new URL(result.url).hostname;
    assert.ok(host === "linkedin.com" || host.endsWith(".linkedin.com"));
  }
});

test("search without includeDomainsMode still works", { skip }, async () => {
  const client = tavily({ apiKey });
  const response = await client.search("What is the capital of France?");
  assert.ok(Array.isArray(response.results));
  assert.ok(response.results.length > 0);
});

test("includeDomainsMode without includeDomains is rejected", { skip }, async () => {
  const client = tavily({ apiKey });
  await assert.rejects(
    () => client.search("quarterly earnings outlook", { includeDomainsMode: "boost" }),
    /include_domains/i
  );
});

test("includeDomainsMode boost is rejected for topic=news", { skip }, async () => {
  const client = tavily({ apiKey });
  await assert.rejects(
    () =>
      client.search("quarterly earnings outlook", {
        topic: "news",
        includeDomains: ["bloomberg.com"],
        includeDomainsMode: "boost",
      }),
    /include_domains_mode.*not supported/i
  );
});

test("includeDomainsMode boost is rejected for fast search depth", { skip }, async () => {
  const client = tavily({ apiKey });
  await assert.rejects(
    () =>
      client.search("quarterly earnings outlook", {
        searchDepth: "fast",
        includeDomains: ["bloomberg.com"],
        includeDomainsMode: "boost",
      }),
    /include_domains_mode.*not supported/i
  );
});
