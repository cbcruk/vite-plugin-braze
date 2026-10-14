import { defineConfig } from 'vite-plus'
import { brazePreview } from './src/plugin/braze-preview.ts'

export default defineConfig({
  plugins: [brazePreview({ root: 'templates' })],
  fmt: {
    ignorePatterns: ['test/__snapshots__/**'],
    singleQuote: true,
    semi: false,
  },
  test: {
    include: ['test/**/*.test.ts'],
    env: { TZ: 'Asia/Seoul' },
  },
})
