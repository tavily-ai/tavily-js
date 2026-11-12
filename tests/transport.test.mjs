import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import { once } from "node:events";
import { Readable } from "node:stream";
import { AxiosError } from "axios";
import {
  tavily,
  createTransport,
  TavilyRequestError,
  TavilyKeylessLimitError,
} from "../dist/index.mjs";

for (const key of ["TAVILY_API_KEY", "TAVILY_HTTP_PROXY", "TAVILY_HTTPS_PROXY", "TAVILY_PROJECT", "TAVILY_ORG_ID"]) {
  delete process.env[key];
}

// Adapter stub: records the request and answers with a canned status/body, rejecting like axios does for non-2xx.
function stub(status, data, calls = []) {
  return async (config) => {
    calls.push(config);
    const response = { data, status, statusText: "", headers: {}, config, request: {} };
    if (status >= 200 && status < 300) return response;
    throw new AxiosError(`status ${status}`, "ERR_BAD_REQUEST", config, {}, response);
  };
}

test("keyed headers carry credentials and identity", async () => {
  const calls = [];
  const t = createTransport({
    apiKey: "tvly-key",
    clientSource: "my-cli",
    sessionId: "s1",
    humanId: "h1",
    clientName: "c1",
    projectId: "p1",
    orgId: "o1",
    adapter: stub(200, {}, calls),
  });
  await t.post("search", { query: "x" });
  const h = calls[0].headers;
  assert.equal(h.get("Authorization"), "Bearer tvly-key");
  assert.equal(h.get("X-Client-Source"), "my-cli");
  assert.equal(h.get("X-Session-Id"), "s1");
  assert.equal(h.get("X-Human-Id"), "h1");
  assert.equal(h.get("X-Client-Name"), "c1");
  assert.equal(h.get("X-Project-ID"), "p1");
  assert.equal(h.get("X-Tavily-Orgid"), "o1");
  assert.match(h.get("Content-Type"), /application\/json/);
});

test("keyless headers have the access mode, no Authorization, and honor clientSource", async () => {
  const calls = [];
  const adapter = stub(200, {}, calls);
  await createTransport({ adapter }).post("search", {});
  await createTransport({ clientSource: "my-cli-keyless", adapter }).post("search", {});
  assert.equal(calls[0].headers.get("X-Tavily-Access-Mode"), "keyless");
  assert.equal(calls[0].headers.get("Authorization"), undefined);
  assert.equal(calls[0].headers.get("X-Client-Source"), "tavily-js-keyless");
  assert.equal(calls[1].headers.get("X-Client-Source"), "my-cli-keyless");
});

test("432 rejects with TavilyRequestError carrying status and body", async () => {
  const body = { detail: { error: "Plan limit" } };
  const t = createTransport({ apiKey: "k", adapter: stub(432, body) });
  await assert.rejects(t.post("search", {}), (err) => {
    assert.ok(err instanceof TavilyRequestError);
    assert.equal(err.message, "Plan limit");
    assert.equal(err.status, 432);
    assert.deepEqual(err.body, body);
    return true;
  });
});

test("keyless-limit envelope rejects with TavilyKeylessLimitError in keyed and keyless mode", async () => {
  const envelope = {
    error: {
      code: "hourly_cap_reached", message: "Cap hit", window: "hour", retry_after_seconds: 5,
      next_actions: [
        { type: "signup", resource: "https://app.tavily.com", instruction: "Sign up" },
        {
          type: "bonus_credits", resource: "https://api.tavily.com/bonus", instruction: "Answer",
          params: { questions: ["What are you building?"], credits_on_completion: 50 },
        },
      ],
    },
  };
  for (const options of [{ apiKey: "k" }, {}]) {
    const t = createTransport({ ...options, adapter: stub(429, envelope) });
    await assert.rejects(t.post("search", {}), (err) => {
      assert.ok(err instanceof TavilyKeylessLimitError);
      assert.ok(err instanceof TavilyRequestError);
      assert.equal(err.status, 429);
      assert.deepEqual(err.body, envelope);
      assert.equal(err.message, "Cap hit");
      assert.equal(err.capType, "hourly_cap_reached");
      assert.equal(err.window, "hour");
      assert.equal(err.retryAfter, 5);
      assert.equal(err.bonusEligible, true);
      assert.deepEqual(err.continuationPaths, envelope.error.next_actions);
      return true;
    });
  }
});

test("keyless 400 with an error.message body rejects with TavilyRequestError, not a cap", async () => {
  const body = { error: { code: "invalid_request", message: "bad" } };
  const t = createTransport({ adapter: stub(400, body) });
  await assert.rejects(t.post("search", {}), (err) => {
    assert.ok(err instanceof TavilyRequestError);
    assert.equal(err.status, 400);
    assert.equal(err.message, "bad");
    assert.deepEqual(err.body, body);
    return true;
  });
});

test("post returns the raw snake_case body", async () => {
  const body = { response_time: 1.5, request_id: "r", results: [{ raw_content: "x" }] };
  const calls = [];
  const t = createTransport({ apiKey: "k", apiBaseURL: "http://example.test", adapter: stub(200, body, calls) });
  assert.deepEqual(await t.post("search", { query: "q" }), body);
  assert.equal(calls[0].url, "http://example.test/search");
});

test("stream yields the chunks", async () => {
  const t = createTransport({ apiKey: "k", adapter: stub(200, Readable.from([Buffer.from("a"), Buffer.from("b")])) });
  const chunks = [];
  for await (const chunk of await t.stream("research", { input: "x", stream: true })) chunks.push(chunk.toString());
  assert.deepEqual(chunks, ["a", "b"]);
});

test("client.search still returns camelCase", async () => {
  process.env.NO_PROXY = "127.0.0.1";
  const srv = createServer((req, res) => {
    req.resume();
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      images: [],
      results: [{ title: "T", url: "https://e.com", content: "c", raw_content: "r", score: 1 }],
      response_time: 0.1,
      request_id: "id",
    }));
  });
  srv.listen(0, "127.0.0.1");
  await once(srv, "listening");
  try {
    const client = tavily({ apiKey: "k", apiBaseURL: `http://127.0.0.1:${srv.address().port}` });
    const res = await client.search("q");
    assert.equal(res.responseTime, 0.1);
    assert.equal(res.requestId, "id");
    assert.equal(res.results[0].rawContent, "r");
  } finally {
    await new Promise((r) => srv.close(r));
  }
});
