/**
 * Snapshot testing helpers for Braze Liquid templates.
 *
 * @example Snapshot every scenario
 * ```ts
 * import * as vitest from 'vitest'
 * import { defineBrazeSnapshots } from 'vite-plugin-braze/test'
 *
 * await defineBrazeSnapshots(vitest, { root: 'templates' })
 * ```
 *
 * @module
 */

export { defineBrazeSnapshots } from './snapshot/snapshot.ts'
export type { BrazeSnapshotOptions, SnapshotTestApi } from './snapshot/snapshot.types.ts'
