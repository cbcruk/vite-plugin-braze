/** The template and scenario currently shown, mirrored in `location.hash`. */
export interface Selection {
  template: string
  scenario: string
}

/** Width preset for the preview frame. */
export type Viewport = 'desktop' | 'mobile'

/** DOM nodes the preview UI writes to. */
export interface PreviewElements {
  nav: HTMLElement
  title: HTMLElement
  status: HTMLElement
  message: HTMLElement
  frame: HTMLIFrameElement
  viewportButtons: HTMLButtonElement[]
}
