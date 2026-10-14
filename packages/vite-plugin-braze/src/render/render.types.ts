/** Identifies one template rendered with one mock data scenario. */
export interface RenderRequest {
  /** Absolute path of the templates root directory. */
  root: string
  /** Template directory name under `root`. */
  template: string
  /** Scenario name, i.e. the mock data file name without `.json`. */
  scenario: string
}

/**
 * Outcome of rendering a scenario.
 *
 * - `ok`: the message would be sent with `html` as its body.
 * - `aborted`: an `abort_message` tag ran, so Braze would skip sending.
 * - `error`: the template failed to parse or render.
 */
export type RenderResult =
  | { status: 'ok'; html: string }
  | { status: 'aborted'; message: string }
  | { status: 'error'; message: string }
