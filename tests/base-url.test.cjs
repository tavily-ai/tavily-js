const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');

// Keep these local transport tests independent of machine-wide proxy settings.
for (const name of ['HTTP_PROXY', 'http_proxy', 'HTTPS_PROXY', 'https_proxy', 'ALL_PROXY', 'all_proxy', 'TAVILY_HTTP_PROXY', 'TAVILY_HTTPS_PROXY']) {
  delete process.env[name];
}

for (const format of ['cjs', 'esm']) {
  for (const [suffix, prefix] of [['', ''], ['/', ''], ['/gateway', '/gateway'], ['/gateway/', '/gateway']]) {
    for (const method of ['search', 'getResearch']) {
      test(`${format} ${method} preserves the base path with suffix ${JSON.stringify(suffix)}`, async t => {
        const received = [];
        const path = `${prefix}/${method === 'search' ? 'search' : 'research/job-1'}`;
        const server = http.createServer((req, res) => {
          received.push({ method: req.method, url: req.url, auth: req.headers.authorization });
          req.resume();
          res.setHeader('Content-Type', 'application/json');
          if (req.url !== path) {
            res.writeHead(404);
            res.end(JSON.stringify({ detail: { error: 'Unknown gateway route' } }));
            return;
          }
          res.end(JSON.stringify(method === 'search'
            ? { images: [], results: [], response_time: 0.1 }
            : { request_id: 'job-1', status: 'completed' }));
        });
        server.listen(0, '127.0.0.1');
        await once(server, 'listening');
        t.after(() => new Promise(resolve => server.close(resolve)));
        const { tavily } = format === 'cjs' ? require('../dist/index.js') : await import('../dist/index.mjs');
        const client = tavily({
          apiKey: 'tvly-local-test',
          apiBaseURL: `http://127.0.0.1:${server.address().port}${suffix}`,
        });
        const response = await client[method](method === 'search' ? 'gateway test' : 'job-1');
        assert.equal(method === 'search' ? response.query : response.request_id, method === 'search' ? 'gateway test' : 'job-1');
        assert.deepEqual(received, [{ method: method === 'search' ? 'POST' : 'GET', url: path, auth: 'Bearer tvly-local-test' }]);
      });
    }
  }
}
