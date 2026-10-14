import Liquid from 'brazejs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { TEMPLATE_FILE } from '../catalog/catalog.ts'
import type { RenderRequest, RenderResult } from './render.types.ts'

const engine = new Liquid()

/**
 * Renders a template with a scenario's mock data, as Braze would.
 *
 * `parse` and `render` are called separately because brazejs's
 * `renderFile`/`parseAndRender` swallow `abort_message` and return its text as
 * if it were the rendered body.
 */
export async function renderScenario({
  root,
  template,
  scenario,
}: RenderRequest): Promise<RenderResult> {
  const dir = join(root, template)
  const file = join(dir, TEMPLATE_FILE)

  try {
    const [source, data] = await Promise.all([
      readFile(file, 'utf8'),
      readFile(join(dir, `${scenario}.json`), 'utf8'),
    ])
    const html = await engine.render(engine.parse(source, file), JSON.parse(data))

    return { status: 'ok', html }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { status: 'aborted', message: error.message }
    }

    return { status: 'error', message: error instanceof Error ? error.message : String(error) }
  }
}
