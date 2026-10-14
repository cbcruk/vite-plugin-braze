import * as vitest from 'vite-plus/test'
import { defineBrazeSnapshots } from 'vite-plugin-braze/test'

await defineBrazeSnapshots(vitest, {
  root: 'templates',
  now: '2024-06-12T09:00:00+09:00',
})
