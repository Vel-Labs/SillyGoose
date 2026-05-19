import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname
    }
  },
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
    pool: "forks"
  }
});
