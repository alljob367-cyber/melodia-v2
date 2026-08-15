import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/__tests__/**/*.test.ts", "src/__tests__/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      include: ["src/lib/core/**/*.ts", "src/hooks/**/*.ts"],
      exclude: ["src/lib/core/ARCHITECTURE.ts"],
    },
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
