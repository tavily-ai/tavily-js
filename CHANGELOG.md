# Changelog

## 1.1.0

### Added

- `createTransport(options)` and the `TavilyTransport` type: authenticated `post`, `get`, and
  `stream` calls that resolve with the raw, untouched response body. Handles credentials,
  keyless mode, identity headers, proxies, base URL, and timeouts. The typed client methods now
  use it.
- `TavilyRequestError`, thrown for non-2xx responses, with `status`, `body`, and `docs`
  (the `documentation` URL from the response, when present).
- `TavilyKeylessLimitError.window`: the cap window from the keyless-limit envelope, or `null`.

### Changed

- `TavilyContinuationPath` is now typed as the API sends it:
  `{ type: "signup" | "agentic_payment" | "bonus_credits"; resource?: string; instruction?: string }`.
  The `url` and `details` fields were never sent.
- A keyless-limit response received in keyed mode now throws `TavilyRequestError` instead of
  `TavilyKeylessLimitError`, which is thrown only in keyless mode.
- Keyless mode now honors `clientSource` for `X-Client-Source`; the default stays
  `tavily-js-keyless`.
- Streaming research errors now carry the parsed error body instead of an unread stream.

## 1.0.0 (unreleased)

### Added

- Search options: `safeSearch`, `includePublishedDate`, and `filterByPublishedDate`.
- Reusable Search field definitions and JSON Schema from `@tavily/core/parameters`,
  and optional Zod 4 schemas from `@tavily/core/agent-schemas`.

### Compatibility

- Optional agent inputs accept `null` and normalize it to `undefined`.
- The new package subpaths support legacy TypeScript `node`/`node10` resolution.

### Removed

- Deprecated `searchQNA()` and `searchContext()` methods and their associated
  `TavilyQNASearchFuncton` and `TavilyContextSearchFuncton` types.

### Migrating from 0.x

Use `search()` to request an answer or build context from the returned results:

```javascript
import { tavily } from "@tavily/core";

const client = tavily();
const response = await client.search("Battery recycling methods", {
  searchDepth: "advanced",
  includeAnswer: true,
});

const answer = response.answer;
const context = JSON.stringify(
  response.results.map(({ url, content }) => ({ url, content }))
);
```

`searchDepth: "advanced"` preserves the old Q&A helper's default; keep any other
search depth you previously configured. For context-only requests, omit
`includeAnswer`. Context is no longer truncated to `maxTokens` (previously 4,000
by default); apply your token budget before passing it to a model.
