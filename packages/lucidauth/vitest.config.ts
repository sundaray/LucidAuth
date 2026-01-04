import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 1. Environment
    // Options: 'node' (default), 'jsdom', 'happy-dom', 'edge-runtime'.
    // Meaning: "Run these tests in a Node.js environment."
    environment: 'node',

    // Meaning: "Only look for test files that match this pattern."
    // **/*.test.ts means "Any folder, any file ending in .test.ts"
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],

    setupFiles: ['./vitest.setup.ts'],

    // 3. Coverage Configuration
    coverage: {
      // Q: What does 'provider: v8' mean?
      // A: This is the tool that calculates which lines of code ran.
      // 'v8': Uses the built-in coverage tool inside the Node.js engine (Google V8).
      //       It is extremely fast and accurate.
      provider: 'v8',

      // A: This tells Vitest HOW to show you the results.
      // 'text': Prints that nice table in your terminal.
      reporter: ['text'],

      // We ignore node_modules (not our code) and tests (we don't test the tests).
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.test.ts',
        'src/types/**',
      ],
    },
  },
});
