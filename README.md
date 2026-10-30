# Tavily JavaScript SDK

Tavily's JavaScript SDK allows for easy interaction with the Tavily API, offering the full range of our search, extract, crawl, map, and research functionalities directly from your JavaScript and TypeScript programs. Easily integrate smart search, content extraction, and research capabilities into your applications, harnessing Tavily's powerful features.

## Installing

```bash
npm i @tavily/core
```

# Tavily Search

Connect your LLM to the web using the Tavily Search API. Tavily Search is a powerful search engine tailored for use by LLMs in agentic applications.

## Usage

Below is a simple code snippet that shows you how to use Tavily Search. The different steps and components of this code are explained in more detail on the JavaScript [API Reference](https://docs.tavily.com/sdk/get-started/javascript) page.

```javascript
const { tavily } = require("@tavily/core");

// Step 1. Instantiating your Tavily client
const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });

// Step 2. Executing a simple search query
const response = await tvly.search("Who is Leo Messi?");

// Step 3. That's it! You've done a Tavily Search!
console.log(response);
```

### Using exact match to find specific names or phrases

```javascript
const { tavily } = require("@tavily/core");

const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });

// Use exactMatch: true to only return results containing the exact phrase(s) inside quotes
const response = await tvly.search('"John Smith" CEO Acme Corp', {
  exactMatch: true,
});
console.log(response);
```

### Keyless mode

You can try Tavily without an API key. When `apiKey` is omitted (and the
`TAVILY_API_KEY` environment variable is not set), the client runs in
**keyless mode**: `search` and `extract` are available with a shared rate
limit, and the other methods throw an error directing you to provide a key.

```javascript
const { tavily, TavilyKeylessLimitError } = require("@tavily/core");

// No apiKey — keyless mode
const tvly = tavily();

try {
  const response = await tvly.search("Who is Leo Messi?");
  console.log(response);
} catch (err) {
  if (err instanceof TavilyKeylessLimitError) {
    // Rate-limit cap hit. Inspect structured fields to decide what to do next.
    console.log("cap:", err.capType);
    console.log("retry after:", err.retryAfter);
    console.log("bonus eligible:", err.bonusEligible);
    console.log("continuation options:", err.continuationPaths);
  } else {
    throw err;
  }
}
```

> To learn more about the different parameters, head to our [JavaScript API Reference](https://docs.tavily.com/sdk/reference/javascript).

## Shared Search schemas for integrations

`@tavily/core/parameters` exports dependency-free `searchParameters` (individual
JSON Schema field definitions), `searchAgentInputParams` (the approved selection
and required/optional status), and `searchAgentInputJsonSchema` (Draft 2020-12).
The field definitions also supply the SDK's named Search option types.

`@tavily/core/agent-schemas` exports `searchAgentInputSchema`,
`searchParameterSchemas`, and the `SearchAgentInput` type. This entry point
requires **Zod 4 Classic** (`npm install zod@^4`). Zod is an optional peer and
is not bundled or loaded by the normal client or the neutral parameters entry
point. Zod 3 validators, including `zod/v3`, are not directly compatible.

The approved Search input has required `query` and optional `searchDepth`,
`timeRange`, and `exactMatch`. It preserves all SDK depth values and time aliases.
It supplies no defaults and strips unknown keys when parsed. The JSON Schema
advertises only those fields with `additionalProperties: false`; a JSON Schema
validator may reject extras instead of stripping them. Individual field
validators are required; call `.optional()` when composing an optional field.

For example, a Zod 4 tool wrapper can use `searchAgentInputSchema` as its
`inputSchema` and execute it like this:

```typescript
import { tavily, type TavilySearchOptions } from "@tavily/core";
import { searchAgentInputSchema } from "@tavily/core/agent-schemas";

const client = tavily({ apiKey: process.env.TAVILY_API_KEY });
const options: TavilySearchOptions = {
  searchDepth: "advanced",
  safeSearch: true,
  includePublishedDate: true,
  filterByPublishedDate: false,
};

async function execute(input: unknown) {
  const { query, ...overrides } = searchAgentInputSchema.parse(input);
  const definedOverrides = Object.fromEntries(
    Object.entries(overrides).filter(([, value]) => value !== undefined)
  );
  return client.search(query, { ...options, ...definedOverrides });
}
```

Filtering `undefined` preserves developer settings; explicit `false` still
overrides them. Credentials and client configuration belong in `tavily(...)`.
The SDK does not automatically validate requests with these opt-in schemas.

Adoption is deliberate: replace copied definitions once, then dependency updates
carry shared descriptions, enums, constraints, and approved profile changes.
Adding an SDK option does **not** add an agent input. Wrappers keep responsibility
for host-specific inputs, configuration precedence, and runtime support; adopting
this profile must not silently remove their existing public inputs. TypeBox,
Convex, and Zod 3 consumers need an appropriate adapter or their own composition
of the neutral definitions. Only Search currently has an approved profile.

For maintainers, add Search request fields in `src/parameters.ts` and their wire
mapping in `src/search.ts`. Types and schema exports derive from the field
definitions; update `searchAgentInputParams` only for an approved agent interface
change. Use the same separation for additional tools when their contracts are
agreed. Transport-only settings and deprecated aliases stay in `src/types.ts`.

Run `npm test` for loopback HTTP and schema regressions. `npm run test:package`
also packs and installs temporary consumers to check ESM, CommonJS, declarations,
and optional Zod isolation; it needs npm registry access and an isolated temporary
directory. Set `TAVILY_TEST_ZOD_VERSION=4.0.0` to check the minimum supported peer.

# Tavily Extract

The Tavily Extract API allows you to effortlessly retrieve raw content from a list of websites, making it ideal for data collection, content analysis, and research. You can also combine Tavily Extract with our Search method: first, obtain a list of relevant documents, then perform further processing on selected links to gather additional information and use it as context for your research tasks.

## Usage

Below is a simple code snippet demonstrating how to use Tavily Extract. The different steps and components of this code are explained in more detail on the JavaScript [API Reference](https://docs.tavily.com/docs/javascript-sdk/tavily-extract/api-reference) page.

```javascript
const { tavily } = require("@tavily/core");

// Step 1. Instantiating your TavilyClient
const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });

// Step 2. Defining the list of URLs to extract content from
const urls = [
  "https://en.wikipedia.org/wiki/Artificial_intelligence",
  "https://en.wikipedia.org/wiki/Machine_learning",
  "https://en.wikipedia.org/wiki/Data_science",
  "https://en.wikipedia.org/wiki/Quantum_computing",
  "https://en.wikipedia.org/wiki/Climate_change",
]; // You can provide up to 20 URLs simultaneously

// Step 3. Executing the extract request
response = await tvly.extract(urls);

// Step 4. Printing the extracted raw content
for (let result of response.results) {
  console.log(`URL: ${result.url}`);
  console.log(`Raw Content: ${result.rawContent}\n`);
}
// Note that URLs that could not be extracted will be stored in response.failedResults
```

> To learn more about the different parameters, head to our [JavaScript API Reference](https://docs.tavily.com/sdk/reference/javascript).

# Tavily Crawl

Tavily Crawl is an agent‐first site explorer that leverages breadth‐first crawling to navigate websites. It uses natural-language goals to intelligently uncover deeply buried “needle-in-a-haystack” information or perform high-volume data retrieval across an entire site.

## Usage

Below is a simple code snippet demonstrating how to use Tavily Crawl. The different steps and components of this code are explained in more detail on the JavaScript [API Reference](https://docs.tavily.com/docs/javascript-sdk/tavily-crawl/api-reference) page.

```javascript
const { tavily } = require("@tavily/core");

// Step 1. Instantiating your Tavily client
const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });

// Step 2. Defining the starting URL to crawl
const start_url = "https://wikipedia.org/wiki/Lemon";

// Step 3. Executing the crawl request with instructions to surface only pages about citrus fruits
response = await tvly.crawl(start_url, {
  max_depth: 3,
  limit: 50,
  instructions: "Find all pages on citrus fruits",
});

// Step 4. Printing pages matching the query
for (let result of response.results) {
  console.log(`URL: ${result.url}`);
  console.log(`Raw Content: ${result.rawContent.substring(0, 200)}...`);
}
```

# Tavily Map

Map lets you discover and visualize the structure of a website starting from a base URL.

## Usage

Below are some code snippets that demonstrate how to interact with our Map API. Each step and component of this code is explained in greater detail in the API Methods section below.

### Mapping a website with instructions

```javascript
const { tavily } = require("@tavily/core");

// Step 1. Instantiating your Tavily client
const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });

// Step 2. Defining the starting URL
const start_url = "https://wikipedia.org/wiki/Lemon";

// Step 3. Executing the map request with parameters to focus on specific pages
response = await tvly.map(start_url, {
  max_depth: 3,
  limit: 50,
  instructions: "Find all pages on citrus fruits",
});

// Step 4. Printing the site structure
for (let url of response.results) {
  console.log(`URl: ${url}`);
}
```

> To learn more about the different parameters, head to our [JavaScript API Reference](https://docs.tavily.com/sdk/reference/javascript).

# Tavily Research

Research lets you create comprehensive research reports on any topic, with automatic source gathering, analysis, and structured output.

## Usage

Below are some code snippets that demonstrate how to interact with our Research API. Each step and component of this code is explained in greater detail in the API Methods section below.

### Creating a research task and retrieving results

```javascript
const { tavily } = require("@tavily/core");

// Step 1. Instantiating your Tavily client
const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });

// Step 2. Creating a research task
const response = await tvly.research("Research the latest developments in AI", {
  model: "pro",
  citationFormat: "apa",
});

// Step 3. Retrieving the research results
const requestId = response.requestId;
const result = await tvly.getResearch(requestId);

// Step 4. Printing the research report
console.log(`Status: ${result.status}`);
console.log(`Content: ${result.content}`);
console.log(`Sources: ${result.sources.length} sources found`);
```

### Research credit usage

```javascript
const { tavily } = require("@tavily/core");
const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });
const result = await tvly.getResearch("YOUR_REQUEST_ID", { includeUsage: true });
console.log(result.usage?.credits);
```

Usage is off by default. Some tasks have no usage data.

### Streaming research results

```javascript
const { tavily } = require("@tavily/core");

// Step 1. Instantiating your Tavily client
const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });

// Step 2. Creating a streaming research task
const stream = await tvly.research("Research the latest developments in AI", {
  model: "pro",
  stream: true,
});

// Step 3. Processing the stream as it arrives
for await (const chunk of result as AsyncGenerator<Buffer, void, unknown>) {
    console.log("Received chunk:", chunk.toString('utf-8'));
}
```

> To learn more about the different parameters, head to our [JavaScript API Reference](https://docs.tavily.com/sdk/reference/javascript).

# Tavily Feedback

Feedback lets you report on how useful a search request or session was, so Tavily can improve result quality over time.

## Usage

Below is a code snippet that demonstrates how to submit feedback. Each step and component of this code is explained in greater detail in the API Methods section below.

### Scoring a search request

```javascript
const { tavily } = require("@tavily/core");

const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });

const response = await tvly.search("Latest AI developments");

// An agent scores its own search call — honestly, per result, not one flat number
await tvly.feedback({
  requestId: response.requestId,
  agentScore: 0.7,
  urlsScores: [
    { id: response.results[0].id, agentScore: 0.9 },
    { id: response.results[1].id, agentScore: 0.2, comment: "Outdated — reports on a 2023 event" },
  ],
});
```

> To learn more about the different parameters, head to our [JavaScript API Reference](https://docs.tavily.com/sdk/reference/javascript).

# Additional Information

## Proxies

If you want to use either client with specified HTTP or HTTPS proxies, you can do so by passing the proxies parameter as a dictionary in the format `{ http?: string, https?: string }`, where each key is optional, or by setting the `TAVILY_HTTP_PROXY` or `TAVILY_HTTPS_PROXY` environment variables.

## Session & User Tracking

`sessionId`, `humanId`, and `clientName` are optional identifiers that help attribute requests to a logical session, an end user, and a named client. All three are sent as HTTP headers (`X-Session-Id`, `X-Human-Id`, `X-Client-Name`) and are never persisted in raw form — `humanId` is hashed server-side.

Set them once at client init, or per-call (per-call wins):

```javascript
// Client-level — applied to every request
const client = tavily({
  apiKey: "tvly-YOUR_API_KEY",
  sessionId: "my-session-123",
  humanId: "internal-user-id-42",
  clientName: "my-app",
});

// Per-call override
await client.search("hello", { sessionId: "ad-hoc-session" });
```

All three are opt-in. Leave them unset and the SDK sends nothing — behavior is identical to earlier versions.

## Cost

Head to the [API Credits Overview](https://docs.tavily.com/guides/api-credits) in our documentation to learn more about how many API Credits each request costs.

## License

This project is licensed under the terms of the MIT license.

## Contact

If you are encountering issues while using Tavily, please email us at [support@tavily.com](mailto:support@tavily.com). We'll be happy to help you.

If you want to stay updated on the latest Tavily news and releases, head to our [Developer Community](https://community.tavily.com) to learn more!
