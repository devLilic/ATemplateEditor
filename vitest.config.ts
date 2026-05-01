import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src'),
    },
  },
  test: {
    root: __dirname,
    include: ['tests/unit/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: ['test/**', 'node_modules/**', 'dist/**', 'dist-electron/**', 'release/**'],
    testTimeout: 1000 * 29,
  },
})
