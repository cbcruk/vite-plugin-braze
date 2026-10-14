import type { TemplateEntry } from '../catalog/catalog.types.ts'
import type { RenderResult } from '../render/render.types.ts'
import type { PreviewElements, Selection, Viewport } from './preview.types.ts'
import { toHash } from './preview.utils.ts'

const VIEWPORT_WIDTHS: Record<Viewport, string> = {
  desktop: '100%',
  mobile: '375px',
}

const STATUS_LABELS: Record<RenderResult['status'], string> = {
  ok: 'Rendered',
  aborted: 'Aborted',
  error: 'Error',
}

/** Looks up the preview UI nodes declared in `index.html`. */
export function queryElements(): PreviewElements {
  return {
    nav: requireElement('#templates'),
    title: requireElement('#title'),
    status: requireElement('#status'),
    message: requireElement('#message'),
    frame: requireElement<HTMLIFrameElement>('#preview'),
    viewportButtons: [...document.querySelectorAll<HTMLButtonElement>('[data-viewport]')],
  }
}

/** Renders the template list, marking the selected scenario as current. */
export function renderNav(
  nav: HTMLElement,
  templates: TemplateEntry[],
  selection: Selection | null,
): void {
  nav.replaceChildren(
    ...templates.flatMap(({ name, scenarios }) => {
      const heading = document.createElement('h2')
      heading.textContent = name

      const links = scenarios.map((scenario) => {
        const link = document.createElement('a')
        link.href = toHash({ template: name, scenario })
        link.textContent = scenario
        if (selection?.template === name && selection.scenario === scenario) {
          link.setAttribute('aria-current', 'page')
        }
        return link
      })

      return [heading, ...links]
    }),
  )
}

/**
 * Shows a render result for `selection`.
 *
 * Re-rendering the same selection keeps the frame's scroll position, so live
 * edits don't jump back to the top.
 */
export function renderResult(
  elements: PreviewElements,
  selection: Selection,
  result: RenderResult,
): void {
  const { title, status, message, frame } = elements
  const key = toHash(selection)
  const scrollY = frame.dataset.key === key ? (frame.contentWindow?.scrollY ?? 0) : 0

  title.textContent = `${selection.template} / ${selection.scenario}`
  status.textContent = STATUS_LABELS[result.status]
  status.dataset.status = result.status

  if (result.status === 'ok') {
    message.hidden = true
    frame.hidden = false
    frame.dataset.key = key
    frame.addEventListener('load', () => frame.contentWindow?.scrollTo(0, scrollY), { once: true })
    frame.srcdoc = result.html
    return
  }

  message.hidden = false
  message.dataset.status = result.status
  message.textContent =
    result.status === 'aborted'
      ? `abort_message: ${result.message}\nBraze would not send this message.`
      : result.message
  frame.hidden = true
  delete frame.dataset.key
}

/** Shows a hint when the templates directory has nothing to preview. */
export function renderEmpty({ title, status, message, frame }: PreviewElements): void {
  title.textContent = ''
  status.textContent = ''
  message.hidden = false
  delete message.dataset.status
  message.textContent =
    'No templates found. Add <root>/<template>/template.liquid and a <scenario>.json next to it.'
  frame.hidden = true
}

/** Resizes the preview frame and updates the viewport toggle state. */
export function applyViewport(
  { frame, viewportButtons }: PreviewElements,
  viewport: Viewport,
): void {
  frame.style.setProperty('--preview-width', VIEWPORT_WIDTHS[viewport])
  for (const button of viewportButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.viewport === viewport))
  }
}

function requireElement<T extends HTMLElement = HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector)
  if (!element) throw new Error(`Missing element: ${selector}`)
  return element
}
