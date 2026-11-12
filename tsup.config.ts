import { defineConfig } from "tsup";

export default defineConfig({
  entryPoints: ["./src/index.ts", "./src/parameters.ts", "./src/agent-schemas.ts"],
  external: ["zod", "zod/v4"],
  // ESM-only since v8; bundled so CommonJS consumers below Node 20.19 can still require() the package.
  noExternal: ["https-proxy-agent"],
  // Its bundled CommonJS dependencies (debug) call require(); give the ESM output a real one.
  esbuildOptions(options, context) {
    if (context.format === "esm") {
      options.banner = {
        js: 'import { createRequire as __createRequire } from "module"; const require = __createRequire(import.meta.url);',
      };
    }
  },
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true
});
