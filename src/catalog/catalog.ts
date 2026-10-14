import { access, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { TemplateEntry } from './catalog.types.ts'

/** File name every template directory must contain. */
export const TEMPLATE_FILE = 'template.liquid'

const DEFAULT_SCENARIO = 'default'

/**
 * Lists template directories under `root` along with their mock data scenarios.
 *
 * Directories without a {@linkcode TEMPLATE_FILE} are skipped.
 */
export async function listTemplates(root: string): Promise<TemplateEntry[]> {
  const dirents = await readdir(root, { withFileTypes: true })
  const entries = await Promise.all(
    dirents
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => readEntry(join(root, dirent.name), dirent.name)),
  )

  return entries
    .filter((entry): entry is TemplateEntry => entry !== null)
    .sort((a, b) => a.name.localeCompare(b.name))
}

async function readEntry(dir: string, name: string): Promise<TemplateEntry | null> {
  try {
    await access(join(dir, TEMPLATE_FILE))
  } catch {
    return null
  }

  const files = await readdir(dir)
  const scenarios = files
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.slice(0, -'.json'.length))
    .sort(compareScenarios)

  return { name, scenarios }
}

function compareScenarios(a: string, b: string): number {
  if (a === DEFAULT_SCENARIO) return -1
  if (b === DEFAULT_SCENARIO) return 1
  return a.localeCompare(b)
}
