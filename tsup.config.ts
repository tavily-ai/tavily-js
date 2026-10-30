import { defineConfig } from "tsup";

export default defineConfig({
  entryPoints: ["./src/index.ts", "./src/parameters.ts", "./src/agent-schemas.ts"],
  external: ["zod", "zod/v4"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true
});
