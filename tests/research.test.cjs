const assert = require("node:assert/strict");
const { createServer } = require("node:http");
const { once } = require("node:events");
const { test } = require("node:test");
const { tavily, TavilyKeylessLimitError } = require("../dist/index.js");

async function withServer(t, status, body, contentType = "application/json") {
  const server = createServer((request, response) => {
    request.resume();
    response.writeHead(status, { "Content-Type": contentType });
    response.end(body);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return tavily({
    apiKey: "test-api-key",
    apiBaseURL: `http://127.0.0.1:${server.address().port}`,
  });
}

test("streaming research preserves the API error message", async (t) => {
  const client = await withServer(
    t,
    400,
    JSON.stringify({ detail: { error: "Invalid research output schema" } })
  );
  await assert.rejects(
    client.research("Test research", { stream: true }),
    { message: "Invalid research output schema" }
  );
});

test("streaming research preserves structured limit errors", async (t) => {
  const client = await withServer(
    t,
    429,
    JSON.stringify({
      error: {
        code: "daily_limit",
        message: "Daily limit reached",
        retry_after_seconds: 60,
        next_actions: [{ type: "signup", url: "https://example.com/signup" }],
      },
    })
  );
  await assert.rejects(client.research("Test research", { stream: true }), (error) => {
    assert.ok(error instanceof TavilyKeylessLimitError);
    assert.equal(error.message, "Daily limit reached");
    assert.equal(error.capType, "daily_limit");
    assert.equal(error.retryAfter, 60);
    assert.deepEqual(error.continuationPaths, [
      { type: "signup", url: "https://example.com/signup" },
    ]);
    return true;
  });
});

test("streaming research retains non-JSON HTTP error details", async (t) => {
  const body = "<html>Service unavailable</html>";
  const client = await withServer(t, 502, body, "text/html");
  await assert.rejects(client.research("Test research", { stream: true }), {
    message: `502 Error: ${JSON.stringify(body)}`,
  });
});

test("streaming research handles an empty HTTP error body", async (t) => {
  const client = await withServer(t, 503, "");
  await assert.rejects(client.research("Test research", { stream: true }), {
    message: '503 Error: ""',
  });
});

test("non-streaming research keeps the existing API error mapping", async (t) => {
  const client = await withServer(
    t,
    400,
    JSON.stringify({ detail: { error: "Invalid research output schema" } })
  );
  await assert.rejects(client.research("Test research"), {
    message: "Invalid research output schema",
  });
});

test("successful research streams still yield the original bytes", async (t) => {
  const body = 'data: {"status":"completed","output":"研究结果"}\n\n';
  const client = await withServer(t, 200, body, "text/event-stream");
  const stream = await client.research("Test research", { stream: true });
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  assert.equal(Buffer.concat(chunks).toString("utf8"), body);
});
