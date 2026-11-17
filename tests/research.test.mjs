import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "node:http";
import { once } from "node:events";
import { tavily } from "../dist/index.mjs";

for (const key of ["TAVILY_HTTP_PROXY", "TAVILY_HTTPS_PROXY"]) delete process.env[key];
process.env.NO_PROXY = "127.0.0.1";
const requests = [];
const task = {
  request_id: "r1",
  created_at: "2026-01-15T10:30:00Z",
  status: "completed",
  content: "Report",
  sources: [{ title: "Example", url: "https://example.com", favicon: "https://example.com/favicon.ico" }],
  response_time: 1.5,
};
const server = createServer(async (req, res) => {
  let body = "";
  for await (const chunk of req) body += chunk;
  requests.push({ path: req.url, body: body && JSON.parse(body) });
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(task));
});
let client;
before(async () => {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  client = tavily({ apiKey: "offline-test", apiBaseURL: `http://127.0.0.1:${server.address().port}` });
});
after(() => server.close());

test("research sends domains and output length with API names", async () => {
  const files = [{ name: "notes.md", data: "aGVsbG8=" }];
  await client.research("question", {
    includeDomains: ["sec.gov"],
    excludeDomains: ["reddit.com"],
    outputLength: "long",
    files,
  });
  assert.deepEqual(requests.at(-1).body, {
    input: "question",
    include_domains: ["sec.gov"],
    exclude_domains: ["reddit.com"],
    output_length: "long",
    files,
  });
});

test("getResearch returns camelCase keys and URL-encodes the request id", async () => {
  const { request_id, created_at, response_time, ...rest } = task;
  assert.deepEqual(await client.getResearch("a/b"), {
    ...rest,
    requestId: request_id,
    createdAt: created_at,
    responseTime: response_time,
  });
  assert.equal(requests.at(-1).path, "/research/a%2Fb");
});
