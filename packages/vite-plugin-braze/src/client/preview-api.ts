import type { TemplateEntry } from '../catalog/catalog.types.ts'
import { API_BASE } from '../plugin/braze-preview.constants.ts'
import type { RenderResult } from '../render/render.types.ts'
import type { Selection } from './preview.types.ts'

/** Fetches every template and its scenarios from the dev server. */
export function fetchTemplates(): Promise<TemplateEntry[]> {
  return fetchJson(`${API_BASE}/templates`)
}

/** Renders the selected scenario on the dev server. */
export function fetchRender({ template, scenario }: Selection): Promise<RenderResult> {
  const params = new URLSearchParams({ template, scenario })
  return fetchJson(`${API_BASE}/render?${params}`)
}

/** Calls `onChange` whenever a file under the templates root changes. */
export function subscribeChanges(onChange: () => void): void {
  new EventSource(`${API_BASE}/events`).addEventListener('message', onChange)
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`)
  return res.json() as Promise<T>
}
