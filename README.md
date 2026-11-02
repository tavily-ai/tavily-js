# Tavily JavaScript SDK

The official JavaScript and TypeScript client for Tavily Search, Extract, Crawl,
Map, Research, and Feedback.

[SDK reference](https://docs.tavily.com/sdk/javascript/reference) ·
[API reference](https://docs.tavily.com/documentation/api-reference/endpoint/search)

## Quick start

```bash
npm install @tavily/core
```

You can try Search and Extract without an API key, subject to shared rate limits.
Crawl, Map, Research, and Feedback require an API key.

Save this as `search.mjs` and run `node search.mjs`:

```javascript
import { tavily } from "@tavily/core";

const client = tavily();
const response = await client.search("How does retrieval-augmented generation work?", {
  maxResults: 5,
});

console.log(response.results);
```

For CommonJS, use `const { tavily } = require("@tavily/core")` and call async
methods inside an `async` function. The examples below reuse `client` from the
quick start. SDK options use camelCase, such as `maxResults` and `searchDepth`.

### Using an API key

Get an API key from [Tavily](https://app.tavily.com) and set it in your environment:

```bash
export TAVILY_API_KEY="tvly-YOUR_API_KEY"
```

The client reads `TAVILY_API_KEY` automatically. You can also pass
`tavily({ apiKey: "tvly-YOUR_API_KEY" })` explicitly.

### Keyless mode

When both `apiKey` and `TAVILY_API_KEY` are absent, `tavily()` enables rate-limited
Search and Extract access. Other methods require an API key.

```javascript
import { tavily, TavilyKeylessLimitError } from "@tavily/core";

const keylessClient = tavily();
try {
  console.log(await keylessClient.search("Battery recycling methods"));
} catch (error) {
  if (error instanceof TavilyKeylessLimitError) {
    console.error(error.capType, error.retryAfter, error.continuationPaths);
  } else {
    throw error;
  }
}
```

`retryAfter` is the suggested wait in seconds, or `null` when unavailable.
See [keyless access](https://docs.tavily.com/documentation/keyless) for limits.

## Search

Search the web and return ranked sources. Request an answer or page content when
you need them:

```javascript
const response = await client.search("Recent advances in battery recycling", {
  searchDepth: "advanced",
  maxResults: 5,
  includeAnswer: true,
  includeRawContent: "markdown",
  includePublishedDate: true,
});

console.log(response.answer);
for (const result of response.results) {
  console.log(result.title, result.url, result.content, result.publishedDate);
}
```

Use `exactMatch: true` with quoted phrases to require an exact match:

```javascript
const response = await client.search('"lithium iron phosphate" recycling', {
  exactMatch: true,
});
```

## Extract

Read page content from known URLs. Failed URLs are returned in `failedResults`:

```javascript
const response = await client.extract([
  "https://en.wikipedia.org/wiki/Artificial_intelligence",
  "https://en.wikipedia.org/wiki/Machine_learning",
], { format: "markdown" });

for (const result of response.results) {
  console.log(result.url, result.rawContent);
}
for (const failure of response.failedResults) {
  console.error(failure.url, failure.error);
}
```

## Crawl

Discover pages on a website and extract their content:

```javascript
const response = await client.crawl("https://docs.tavily.com", {
  instructions: "Find pages about the JavaScript SDK",
  maxDepth: 2,
  limit: 10,
});

for (const result of response.results) {
  console.log(result.url, result.rawContent);
}
```

## Map

Discover URLs on a website without extracting page content:

```javascript
const response = await client.map("https://docs.tavily.com", {
  instructions: "Find API reference pages",
  maxDepth: 2,
  limit: 10,
});

console.log(response.results);
```

## Research

Create a research task, then retrieve its status and report using the returned
`requestId`. Research runs asynchronously; call `getResearch()` again while the
status is `pending` or `in_progress`.

```javascript
const task = await client.research("Compare current battery recycling methods", {
  model: "mini",
  citationFormat: "apa",
});

if ("requestId" in task) {
  const result = await client.getResearch(task.requestId, { includeUsage: true });
  console.log(result.status);
  if ("content" in result) {
    console.log(result.content, result.sources);
  }
  console.log(result.usage?.credits);
}
```

### Streaming

Set `stream: true` to receive raw [Server-Sent Event (SSE) chunks](https://docs.tavily.com/documentation/api-reference/endpoint/research-streaming):

```javascript
const stream = await client.research("Compare current battery recycling methods", {
  model: "mini",
  stream: true,
});

if (Symbol.asyncIterator in stream) {
  for await (const chunk of stream) {
    process.stdout.write(chunk);
  }
}
```

Chunks are byte buffers, not parsed events. If you need individual events,
decode the stream with an SSE parser; a chunk may contain part of an event or
multiple events.

## Feedback

Attach a quality assessment to a Search request or individual result:

```javascript
const response = await client.search("Battery recycling methods");
const firstResult = response.results[0];

if (firstResult) {
  await client.feedback({
    requestId: response.requestId,
    urlsScores: [{ url: firstResult.url, agentScore: 0.9 }],
  });
}
```

Use scores from your application's evaluation or user feedback.

## Agent tool schemas

Use `searchAgentInputSchema` for a Search tool's input: required `query` and
optional `searchDepth`, `timeRange`, and `exactMatch`. Configure other options in
your application. Install Zod 4 to use this schema:

```bash
npm install zod@^4
```

```typescript
import { tavily, type TavilySearchOptions } from "@tavily/core";
import { searchAgentInputSchema } from "@tavily/core/agent-schemas";

const client = tavily();
const defaults: TavilySearchOptions = {
  searchDepth: "advanced",
  maxResults: 5,
  safeSearch: true,
};

export async function execute(input: unknown) {
  const { query, ...overrides } = searchAgentInputSchema.parse(input);
  const definedOverrides = Object.fromEntries(
    Object.entries(overrides).filter(([, value]) => value !== undefined)
  );
  return client.search(query, { ...defaults, ...definedOverrides });
}
```

Parsing strips unknown fields and converts optional `null` to `undefined`.
Filter `undefined` before merging to preserve your defaults; `false` still
overrides them. `client.search()` does not apply this validation automatically.

For custom schemas, this module exports `searchParameterSchemas` (add `.optional()`
where needed) and the parsed input type `SearchAgentInput`.

For JSON Schema, use `searchAgentInputJsonSchema` from `@tavily/core/parameters`.
That module also exports `searchParameters` and `searchAgentInputParams`, without
requiring Zod.

## Configuration

Set optional attribution identifiers on the client:

```javascript
const trackedClient = tavily({
  sessionId: "session-123",
  humanId: "user-42",
  clientName: "my-app",
});

await trackedClient.search("Battery recycling methods", { sessionId: "session-456" });
```

Search, Extract, Crawl, Map, and Research accept per-call overrides for these
identifiers. In `feedback()`, `sessionId` identifies the session being evaluated.

Configure proxies with `tavily({ proxies: { http: "http://localhost:8080",
https: "http://localhost:8080" } })`, or set `TAVILY_HTTP_PROXY` and
`TAVILY_HTTPS_PROXY`. Each proxy is optional.

## Resources

- [Release notes](CHANGELOG.md).
- [SDK reference](https://docs.tavily.com/sdk/javascript/reference): method options and response fields.
- [Credits and pricing](https://docs.tavily.com/documentation/api-credits).
- [Documentation index for agents](https://docs.tavily.com/llms.txt).
- [Support](mailto:support@tavily.com) and [community](https://community.tavily.com).

Released under the [MIT license](LICENSE).
