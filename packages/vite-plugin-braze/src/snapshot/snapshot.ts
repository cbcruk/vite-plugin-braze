import { resolve } from 'node:path'
import { listTemplates } from '../catalog/catalog.ts'
import { renderScenario } from '../render/render.ts'
import type { BrazeSnapshotOptions, SnapshotTestApi } from './snapshot.types.ts'

/**
 * Registers one file snapshot test per template scenario under `root`.
 *
 * Each scenario is snapshotted to `<snapshotDir>/<template>/<scenario>.html`
 * when it renders, or `<scenario>.aborted.txt` with the `abort_message` text
 * when Braze would skip sending. A parse or render error fails the test.
 *
 * Templates are discovered when this is called, so `await` it at the top level
 * of the test file.
 *
 * @example Snapshot every scenario with a fixed clock
 * ```ts
 * import * as vitest from 'vitest'
 * import { defineBrazeSnapshots } from 'vite-plugin-braze/test'
 *
 * await defineBrazeSnapshots(vitest, {
 *   root: 'templates',
 *   now: '2024-06-12T09:00:00+09:00',
 * })
 * ```
 *
 * Run `vitest -u` to update the snapshots after an intentional template change.
 */
export async function defineBrazeSnapshots(
  api: SnapshotTestApi,
  { root, now, snapshotDir = '__snapshots__' }: BrazeSnapshotOptions,
): Promise<void> {
  const { describe, test, expect, beforeAll, afterAll, vi } = api
  const templatesRoot = resolve(root)
  const templates = await listTemplates(templatesRoot)

  if (now !== undefined) {
    beforeAll(() => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date(now))
    })
    afterAll(() => {
      vi.useRealTimers()
    })
  }

  for (const { name, scenarios } of templates) {
    describe(name, () => {
      for (const scenario of scenarios) {
        test(scenario, async () => {
          const result = await renderScenario({ root: templatesRoot, template: name, scenario })

          if (result.status === 'error') throw new Error(result.message)

          const [body, file] =
            result.status === 'ok'
              ? [result.html, `${scenario}.html`]
              : [result.message, `${scenario}.aborted.txt`]

          await expect(body).toMatchFileSnapshot(`${snapshotDir}/${name}/${file}`)
        })
      }
    })
  }
}
