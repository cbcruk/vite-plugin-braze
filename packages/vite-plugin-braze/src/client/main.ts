import './main.css'
import type { TemplateEntry } from '../catalog/catalog.types.ts'
import { fetchRender, fetchTemplates, subscribeChanges } from './preview-api.ts'
import {
  applyViewport,
  queryElements,
  renderEmpty,
  renderNav,
  renderResult,
} from './preview-view.ts'
import type { Viewport } from './preview.types.ts'
import { resolveSelection, toHash } from './preview.utils.ts'

const elements = queryElements()
let templates: TemplateEntry[] = []
let latestRequest = 0

async function show(): Promise<void> {
  const request = ++latestRequest
  const selection = resolveSelection(location.hash, templates)
  renderNav(elements.nav, templates, selection)

  if (!selection) {
    renderEmpty(elements)
    return
  }

  if (location.hash !== toHash(selection)) {
    history.replaceState(null, '', toHash(selection))
  }

  const result = await fetchRender(selection).catch((error: unknown) => ({
    status: 'error' as const,
    message: error instanceof Error ? error.message : String(error),
  }))
  if (request === latestRequest) renderResult(elements, selection, result)
}

async function refresh(): Promise<void> {
  templates = await fetchTemplates()
  await show()
}

for (const button of elements.viewportButtons) {
  button.addEventListener('click', () =>
    applyViewport(elements, button.dataset.viewport as Viewport),
  )
}

window.addEventListener('hashchange', () => void show())
applyViewport(elements, 'desktop')
void refresh()
subscribeChanges(() => void refresh())
