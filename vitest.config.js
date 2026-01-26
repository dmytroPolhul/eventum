import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    testTimeout: 10000,
    pool: 'threads',
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "./coverage",
      exclude: [
        "**/node_modules/**",
        "**/benchmarks/**",
        "**/js/**",
        "**/*.d.ts"
      ]
    }
  },
});
