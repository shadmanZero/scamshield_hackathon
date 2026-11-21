import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**"],
    setupFiles: ["./test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["app/**", "components/**", "hooks/**", "lib/**"],
      exclude: ["**/*.test.*", "components/ui/**", "app/layout.tsx", "app/loading.tsx", "app/error.tsx", "lib/compress-image.ts"],
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
    },
  },
  resolve: { alias: { "@": path.resolve(import.meta.dirname) } },
});
