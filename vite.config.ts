import { defineConfig } from 'vite-plus'
import { brazePreview } from 'vite-plugin-braze'

export default defineConfig({
  plugins: [brazePreview({ root: 'templates' })],
  server: {
    open: '/__braze/',
  },
  fmt: {
    ignorePatterns: ['test/__snapshots__/**', '**/dist/**'],
    singleQuote: true,
    semi: false,
  },
  test: {
    include: ['test/**/*.test.ts'],
    env: { TZ: 'Asia/Seoul' },
  },
})
