import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["packages/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: [
        "packages/utils/src/encryption.ts",
        "packages/ai-core/src/index.ts",
        "packages/workflow-engine/src/{planner,run-workflow}.ts",
        "packages/integrations/src/{buffer,wordpress}.ts",
      ],
      thresholds: { lines: 60, functions: 60, statements: 60, branches: 60 },
    },
  },
});
