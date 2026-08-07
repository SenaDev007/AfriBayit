// AfriBayit — Vitest Configuration (P4.1 + Module 19)
// https://vitest.dev/config/

import { defineConfig } from 'vitest/config';
import path from 'path';

// Workaround: Tailwind 4 + Vite PostCSS plugin conflict — provide empty PostCSS config for tests
process.env.POSTCSS_DISABLE = '1';

export default defineConfig({
  test: {
    // P4.1 + Module 19 — switch to jsdom so component tests can use the DOM
    // (localStorage, matchMedia, etc.). Pure-logic tests still pass under
    // jsdom without changes.
    environment: 'jsdom',
    // Include patterns
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'tests/unit/**/*.{test,spec}.{ts,tsx}',
    ],
    // Exclude patterns
    exclude: [
      'node_modules/**',
      '.next/**',
      'tests/e2e/**',
      'playwright-report/**',
    ],
    // Coverage configuration — Module 19: thresholds set to 0 so the CI
    // doesn't fail on a fresh repo. Include focuses on frontend logic
    // (no Prisma / API routes / server lib in this repo).
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/lib/**/*.ts',
        'src/hooks/**/*.ts',
        'src/stores/**/*.ts',
        'src/components/afribayit/**/*.{ts,tsx}',
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/**/types.ts',
        'src/**/index.ts',
        'src/**/__tests__/**',
        'src/app/**',        // Next.js route handlers — covered by e2e
        'src/components/ui/**', // shadcn/ui primitives — covered by e2e
      ],
      thresholds: {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
      },
    },
    // Setup files
    setupFiles: ['./tests/setup.ts'],
    // Test timeout
    testTimeout: 10000,
    // Don't process CSS files in tests
    server: {
      deps: {
        inline: [/@tailwindcss/, /postcss/],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // P3 — CSS not processed in unit tests. Override postcss config to empty
  // to avoid Tailwind 4 + Vite + PostCSS string plugin conflict.
  css: { postcss: {} },
  plugins: [],
});
