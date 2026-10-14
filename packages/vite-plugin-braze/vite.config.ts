import { defineConfig } from 'vite-plus'
import { UI_BASE } from './src/plugin/braze-preview.constants.ts'
import { brazePreview } from './src/plugin/braze-preview.ts'

export default defineConfig({
  base: UI_BASE,
  plugins: [brazePreview({ root: '../../templates' })],
  build: {
    outDir: 'dist/client',
  },
  pack: {
    entry: ['src/index.ts', 'src/test.ts'],
    dts: true,
    platform: 'node',
  },
})
