import { relative, resolve, sep } from 'node:path'
import type { Plugin } from 'vite'
import { listTemplates } from '../catalog/catalog.ts'
import { renderScenario } from '../render/render.ts'
import { API_BASE } from './braze-preview.constants.ts'
import type { BrazePreviewOptions } from './braze-preview.types.ts'
import { sendJson } from './braze-preview.utils.ts'

/**
 * Serves the template catalog and rendered scenarios to the preview client,
 * and notifies it whenever a file under the templates root changes.
 *
 * - `GET /__braze/templates` returns `TemplateEntry[]`.
 * - `GET /__braze/render?template=&scenario=` returns a `RenderResult`.
 */
export function brazePreview({ root }: BrazePreviewOptions): Plugin {
  let templatesRoot = ''

  return {
    name: 'braze-preview',
    configResolved(config) {
      templatesRoot = resolve(config.root, root)
    },
    configureServer(server) {
      server.watcher.add(templatesRoot)

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
    },
    hotUpdate({ file, server }) {
      if (this.environment.name !== 'client') return
      if (!file.startsWith(templatesRoot + sep)) return

      server.ws.send('braze:change', { file: relative(templatesRoot, file) })
      return []
    },
  }
}
