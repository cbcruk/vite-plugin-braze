import { relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import { listTemplates } from '../catalog/catalog.ts'
import { renderScenario } from '../render/render.ts'
import { API_BASE, DEFAULT_ROOT, UI_BASE } from './braze-preview.constants.ts'
import type { BrazePreviewOptions } from './braze-preview.types.ts'
import { openEventStream, sendJson, serveStatic } from './braze-preview.utils.ts'

// Resolved against the bundled entry in `dist/`, where the prebuilt UI lives in `dist/client/`.
const CLIENT_DIR = fileURLToPath(new URL('./client', import.meta.url))

/**
 * Adds a Braze Liquid template preview to the Vite dev server.
 *
 * The preview UI is served at `/__braze/`. It lists every
 * `<root>/<template>/template.liquid` with its `*.json` mock data scenarios,
 * renders the selected one with [brazejs](https://github.com/yq314/brazejs),
 * and refreshes whenever a file under the templates root changes.
 *
 * Endpoints used by the UI:
 *
 * - `GET /__braze/api/templates` returns `TemplateEntry[]`.
 * - `GET /__braze/api/render?template=&scenario=` returns a `RenderResult`.
 * - `GET /__braze/api/events` streams `{ file }` events when templates change.
 *
 * @example Basic usage
 * ```ts
 * import { defineConfig } from 'vite'
 * import { brazePreview } from 'vite-plugin-braze'
 *
 * export default defineConfig({
 *   plugins: [brazePreview({ root: 'templates' })],
 * })
 * ```
 */
export function brazePreview({ root = DEFAULT_ROOT }: BrazePreviewOptions = {}): Plugin {
  let templatesRoot = ''

  return {
    name: 'braze-preview',
    apply: 'serve',
    configResolved(config) {
      templatesRoot = resolve(config.root, root)
    },
    configureServer(server) {
      const listeners = new Set<(data: unknown) => void>()

      server.watcher.add(templatesRoot)
      server.watcher.on('all', (_event, file) => {
        if (!file.startsWith(templatesRoot + sep)) return
        const data = { file: relative(templatesRoot, file) }
        for (const send of listeners) send(data)
      })

      server.middlewares.use(`${API_BASE}/templates`, (_req, res, next) => {
        listTemplates(templatesRoot)
          .then((templates) => sendJson(res, templates))
          .catch(next)
      })

      server.middlewares.use(`${API_BASE}/render`, (req, res, next) => {
        const params = new URL(req.url ?? '', 'http://localhost').searchParams
        const template = params.get('template') ?? ''
        const scenario = params.get('scenario') ?? ''

        listTemplates(templatesRoot)
          .then(async (templates) => {
            const entry = templates.find((t) => t.name === template)
            if (!entry?.scenarios.includes(scenario)) {
              sendJson(res, { message: `Unknown scenario: ${template}/${scenario}` }, 404)
              return
            }
            sendJson(res, await renderScenario({ root: templatesRoot, template, scenario }))
          })
          .catch(next)
      })

      server.middlewares.use(`${API_BASE}/events`, (req, res) => {
        const send = openEventStream(res)
        listeners.add(send)
        req.on('close', () => listeners.delete(send))
      })

      server.middlewares.use(UI_BASE, serveStatic(CLIENT_DIR))

      const printUrls = server.printUrls.bind(server)
      server.printUrls = () => {
        printUrls()
        for (const url of server.resolvedUrls?.local ?? []) {
          server.config.logger.info(`  ➜  Braze:   ${new URL(UI_BASE, url).href}`)
        }
      }
    },
  }
}
