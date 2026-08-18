import { defineConfig } from 'vitest/config';

const coverageThreshold = Number(
  process.env.COVERAGE_THRESHOLD ?? 60
);

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.js'],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.js'],

      thresholds: {
        lines: coverageThreshold,
        functions: coverageThreshold,
        branches: coverageThreshold,
        statements: coverageThreshold,
      },
    },
  },
});