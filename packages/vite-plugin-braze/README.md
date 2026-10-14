# vite-plugin-braze

Preview and snapshot-test [Braze](https://www.braze.com/) Liquid templates locally with Vite. Rendering uses [brazejs](https://github.com/yq314/brazejs).

> Not affiliated with or endorsed by Braze, Inc.

## Install

```sh
pnpm add -D vite-plugin-braze vite
```

## Templates

```
templates/
  <template>/
    template.liquid   # the body you paste into Braze
    default.json      # mock data scenario (file name = scenario name)
    no-data.json      # more scenarios, e.g. to hit abort_message branches
```

Scenario JSON keys map to the Braze context:

| Template                                   | Scenario JSON                                                    |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `{{${first_name}}}`                        | `"first_name"`                                                   |
| `{{custom_attribute.${key}}}`              | `"custom_attribute": { "key": ... }`                             |
| `api_trigger_properties.${key}`            | `"api_trigger_properties": { "key": ... }`                       |
| `{% connected_content <url> :save data %}` | Wrap the tag in `{% comment %}` and put the response in `"data"` |

## Preview

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { brazePreview } from 'vite-plugin-braze'

export default defineConfig({
  plugins: [brazePreview({ root: 'templates' })],
})
```

Run `vite` and open `http://localhost:5173/__braze/`. The preview re-renders whenever a template or scenario file changes, and shows whether the scenario renders, aborts (`abort_message`, so Braze would not send), or fails.

| Option | Default       | Description                                         |
| ------ | ------------- | --------------------------------------------------- |
| `root` | `'templates'` | Templates root directory, relative to the Vite root |

## Snapshot tests

```ts
// test/templates.test.ts
import * as vitest from 'vitest'
import { defineBrazeSnapshots } from 'vite-plugin-braze/test'

await defineBrazeSnapshots(vitest, {
  root: 'templates',
  now: '2024-06-12T09:00:00+09:00',
})
```

Each scenario becomes one test, snapshotted to `test/__snapshots__/<template>/<scenario>.html`, or `<scenario>.aborted.txt` when it aborts. Render errors fail the test. Run `vitest -u` after an intentional change.

Pass the test API namespace you import from (`vitest` or `vite-plus/test`) so the tests register on the runner that runs the file.

| Option        | Default           | Description                                                   |
| ------------- | ----------------- | ------------------------------------------------------------- |
| `root`        | —                 | Templates root, absolute or relative to the working directory |
| `now`         | real clock        | Fixed current time for `"now"` and date filters               |
| `snapshotDir` | `'__snapshots__'` | Snapshot directory, relative to the test file                 |

`now` fixes the instant, not the time zone. Set `TZ` in the test config (e.g. `test.env.TZ`) to make date output stable across machines.

## Programmatic API

`listTemplates(root)` and `renderScenario({ root, template, scenario })` are exported for custom tooling. `renderScenario` resolves to `{ status: 'ok', html }`, `{ status: 'aborted', message }`, or `{ status: 'error', message }`.

## Caveats

brazejs does not match Braze exactly (for example `url_escape` and `number_with_delimiter`). Do a final check in the Braze dashboard preview.
