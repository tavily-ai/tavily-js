import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const tsc = join(root, "node_modules/typescript/bin/tsc");
const installedZod = JSON.parse(readFileSync(join(root, "node_modules/zod/package.json"))).version;

test("packed ESM/CJS exports and declarations work with optional Zod absent and present", () => {
  const dir = mkdtempSync(join(tmpdir(), "tavily-core-package-"));
  const run = (file, args, cwd = dir) => execFileSync(file, args, { cwd, encoding: "utf8", stdio: "pipe" });
  const compile = file => run(process.execPath, [tsc, "--noEmit", "--strict", "--target", "es2020",
    "--module", "nodenext", "--moduleResolution", "nodenext", "--esModuleInterop",
    "--typeRoots", join(root, "node_modules/@types"), file]);
  try {
    const [pack] = JSON.parse(run("npm", ["pack", "--json", "--pack-destination", dir], root));
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "tavily-pack-test", version: "1.0.0", private: true }));
    run("npm", ["install", join(dir, pack.filename), "--ignore-scripts", "--omit=optional", "--no-audit", "--no-fund"]);

    const plainRuntime = `
      const assert = require('node:assert/strict');
      assert.throws(() => require.resolve('zod'), { code: 'MODULE_NOT_FOUND' });
      for (const load of [name => Promise.resolve(require(name)), name => import(name)]) {
        const core = await load('@tavily/core');
        assert.equal(typeof core.tavily({ apiKey: 'offline-test' }).search, 'function');
        const neutral = await load('@tavily/core/parameters');
        assert.equal(neutral.searchAgentInputJsonSchema.type, 'object');
      }
    `;
    run(process.execPath, ["-e", `(async () => { ${plainRuntime} })().catch(e => { console.error(e); process.exit(1); });`]);
    const plainTypes = `
      import { tavily, type TavilySearchOptions } from '@tavily/core';
      import { searchParameters } from '@tavily/core/parameters';
      const options: TavilySearchOptions = {
        searchDepth: 'ultra-fast', timeRange: 'd', safeSearch: false,
        includePublishedDate: true, filterByPublishedDate: false,
        includeRawContent: false, includeDomains: ['example.com'], future_option: true,
      };
      options.includeDomains?.push('tavily.com');
      tavily({ apiKey: 'offline-test' }).search('test', options);
      // @ts-expect-error Named boolean must not degrade to the extra-parameter any type.
      const bad: TavilySearchOptions = { safeSearch: 'false' };
      // @ts-expect-error Existing enum values remain constrained.
      const badDepth: TavilySearchOptions = { searchDepth: 'deep' };
      type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
      const sameEnum: Equal<NonNullable<TavilySearchOptions['searchDepth']>, typeof searchParameters.searchDepth.enum[number]> = true;
    `;
    for (const extension of ["mts", "cts"]) {
      writeFileSync(join(dir, `plain.${extension}`), plainTypes);
      compile(`plain.${extension}`);
    }

    // Test the declared minimum by setting TAVILY_TEST_ZOD_VERSION=4.0.0.
    const version = process.env.TAVILY_TEST_ZOD_VERSION || installedZod;
    run("npm", ["install", `zod@${version}`, "--ignore-scripts", "--no-audit", "--no-fund"]);
    const schemaTypes = `
      import { z } from 'zod/v4';
      import type { TavilySearchOptions } from '@tavily/core';
      import { searchAgentInputSchema, searchParameterSchemas, type SearchAgentInput } from '@tavily/core/agent-schemas';
      const input: SearchAgentInput = { query: 'test', searchDepth: 'fast', exactMatch: false };
      const options: TavilySearchOptions = searchAgentInputSchema.parse(input);
      const inputType: z.input<typeof searchAgentInputSchema> = input;
      // @ts-expect-error query is required.
      const missing: SearchAgentInput = {};
      // @ts-expect-error developer-only fields cannot enter the agent profile.
      const unapproved: SearchAgentInput = { query: 'test', safeSearch: false };
      // @ts-expect-error Zod input types must also preserve the enum.
      const invalidInput: z.input<typeof searchAgentInputSchema> = { query: 'test', searchDepth: 'deep' };
      const extended = searchAgentInputSchema.extend({ safeSearch: searchParameterSchemas.safeSearch.optional() });
      const composed: z.infer<typeof extended> = { query: 'test', safeSearch: false };
    `;
    for (const extension of ["mts", "cts"]) {
      writeFileSync(join(dir, `schema.${extension}`), schemaTypes);
      compile(`schema.${extension}`);
    }
    run(process.execPath, ["-e", `(async () => {
      const assert = require('node:assert/strict');
      for (const load of [name => Promise.resolve(require(name)), name => import(name)]) {
        const { searchAgentInputSchema } = await load('@tavily/core/agent-schemas');
        const { searchAgentInputJsonSchema } = await load('@tavily/core/parameters');
        const { z } = await load('zod/v4');
        assert.deepEqual(searchAgentInputSchema.parse({ query: 'test' }), { query: 'test' });
        assert.deepEqual(z.toJSONSchema(searchAgentInputSchema), searchAgentInputJsonSchema);
      }
    })().catch(e => { console.error(e); process.exit(1); });`]);
  } catch (error) {
    throw new Error(`${error.message}\n${error.stdout || ''}\n${error.stderr || ''}`, { cause: error });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
