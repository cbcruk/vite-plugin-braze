import type { TemplateEntry } from '../catalog/catalog.types.ts'
import type { Selection } from './preview.types.ts'

/** Formats a selection as a `#template/scenario` hash. */
export function toHash({ template, scenario }: Selection): string {
  return `#${template}/${scenario}`
}

/**
 * Resolves the selection from `hash`, falling back to the first available scenario.
 *
 * @returns The selection, or `null` when there are no templates.
 */
export function resolveSelection(hash: string, templates: TemplateEntry[]): Selection | null {
  const [template = '', scenario = ''] = decodeURIComponent(hash.slice(1)).split('/')
  const entry = templates.find((t) => t.name === template)

  if (entry?.scenarios.includes(scenario)) return { template, scenario }

  const fallback = entry ?? templates.find((t) => t.scenarios.length > 0)
  const firstScenario = fallback?.scenarios[0]
  if (!fallback || firstScenario === undefined) return null

  return { template: fallback.name, scenario: firstScenario }
}
