// AfriBayit — Vitest Configuration (P4.1)
// https://vitest.dev/config/

import { defineConfig } from 'vitest/config';
import path from 'path';

// Workaround: Tailwind 4 + Vite PostCSS plugin conflict — provide empty PostCSS config for tests
process.env.POSTCSS_DISABLE = '1';

export default defineConfig({
  test: {
    // Test environment: node for lib tests, jsdom for component tests
    environment: 'node',
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
    // Coverage configuration (P4.1 — cible 60% sur modules critiques)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      // Prioritize critical modules
      include: [
        'src/lib/payments/escrow-engine.ts',
        'src/lib/payments/payout.ts',
        'src/lib/payments/payout-engine.ts',
        'src/lib/auth.ts',
        'src/lib/auth-guard.ts',
        'src/lib/twofa.ts',
        'src/lib/otp.ts',
        'src/lib/security/**/*.ts',
        'src/lib/rebecca/guardrails.ts',
        'src/lib/rebecca/prompt-injection-guard.ts',
        'src/lib/security/fraud-detector.ts',
        'src/lib/security/rbac.ts',
      ],
      // Don't cover config files, types, or test utilities
      exclude: [
        'src/**/*.d.ts',
        'src/**/types.ts',
        'src/**/index.ts',
        'src/**/__tests__/**',
        'src/app/**',  // Don't measure Next.js route handlers in unit tests
        'src/components/**', // Components covered by e2e
      ],
      thresholds: {
        // P4.1 — initial conservative thresholds (target 60% on critical modules)
        statements: 30,
        branches: 30,
        functions: 30,
        lines: 30,
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
