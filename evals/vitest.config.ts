import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: process.env.VITEST_GLOBALS === 'true',
    setupFiles: ['./setup.ts'],
  },
})
