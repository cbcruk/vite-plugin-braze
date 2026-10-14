import { resolve } from 'node:path'
import { beforeAll, describe, expect, test, vi } from 'vite-plus/test'
import { listTemplates } from '../src/catalog/catalog.ts'
import { renderScenario } from '../src/render/render.ts'

const root = resolve(import.meta.dirname, '../templates')
const templates = await listTemplates(root)

beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2024-06-12T09:00:00+09:00'))
})

describe.each(templates)('$name', ({ name, scenarios }) => {
  test.each(scenarios)('%s', async (scenario) => {
    const result = await renderScenario({ root, template: name, scenario })

    if (result.status === 'error') throw new Error(result.message)

    const snapshot =
      result.status === 'ok'
        ? { body: result.html, file: `${scenario}.html` }
        : { body: result.message, file: `${scenario}.aborted.txt` }

    await expect(snapshot.body).toMatchFileSnapshot(`__snapshots__/${name}/${snapshot.file}`)
  })
})
