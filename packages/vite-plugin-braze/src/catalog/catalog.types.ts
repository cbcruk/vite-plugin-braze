/** A Braze template directory and the mock data scenarios it can be rendered with. */
export interface TemplateEntry {
  /** Directory name under the templates root, used as the template id. */
  name: string
  /** Scenario names, i.e. the `*.json` file names without extension. `default` comes first when present. */
  scenarios: string[]
}
