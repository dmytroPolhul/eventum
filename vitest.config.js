import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    testTimeout: 10000,
    pool: 'forks',
    singleFork: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary", "json"],
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
