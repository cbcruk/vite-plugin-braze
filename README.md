# vite-plugin-braze

[![npm](https://img.shields.io/npm/v/vite-plugin-braze)](https://www.npmjs.com/package/vite-plugin-braze)

A Vite plugin for previewing Braze Liquid templates in the dev server and snapshot-testing them with Vitest. Rendering is powered by [brazejs](https://github.com/yq314/brazejs). This is an unofficial tool, not affiliated with Braze, Inc.

- Package source and docs: [packages/vite-plugin-braze](packages/vite-plugin-braze)
- Experiment history and Braze Liquid notes: [docs/braze-liquid-notes.md](docs/braze-liquid-notes.md)

## Installation

```sh
pnpm add -D vite-plugin-braze
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { brazePreview } from 'vite-plugin-braze'

export default defineConfig({
  plugins: [brazePreview({ root: 'templates' })],
})
```

```ts
// test/templates.test.ts
import * as vitest from 'vitest' // use 'vite-plus/test' with vite-plus
import { defineBrazeSnapshots } from 'vite-plugin-braze/test'

await defineBrazeSnapshots(vitest, {
  root: 'templates',
  now: '2024-06-12T09:00:00+09:00',
})
```

Start `vite` and open `http://localhost:5173/__braze/` to preview. See the [package README](packages/vite-plugin-braze/README.md) for all options.

## Developing in this repository

The root is a project that installs the package via `workspace:*` and applies it to real templates.

## Structure

```
packages/vite-plugin-braze/   # Published package (plugin, preview UI, test helpers)
templates/                    # Templates and mock data scenarios
test/                         # Snapshot tests (using vite-plugin-braze/test)
```

### Commands

```sh
pnpm install
pnpm dev        # Build the package, then start the preview server (http://localhost:5173/__braze/)
pnpm test       # Build the package, then snapshot-test every scenario
pnpm typecheck
pnpm check      # vp check (format + lint)
```

When working on the preview UI itself, run `pnpm --filter vite-plugin-braze dev` to serve it straight from source (UI HMR works; templates come from the root `templates/`).

### Adding a template

```
templates/
  <template-name>/
    template.liquid     # Body to paste into Braze
    default.json        # Mock data scenario (file name = scenario name)
    no-data.json        # e.g. a scenario for checking branches / abort_message
```

Keys in a scenario JSON map to the Braze context.

- `{{${first_name}}}` → `"first_name"`
- `{{custom_attribute.${key}}}` → `"custom_attribute": { "key": ... }`
- `api_trigger_properties.${key}` → `"api_trigger_properties": { "key": ... }`
- Result of `connected_content :save data` → put the response JSON directly under `"data"` and wrap the tag in `{% comment %}`

### Render results

| Status   | Meaning                                     | Snapshot                                        |
| -------- | ------------------------------------------- | ----------------------------------------------- |
| Rendered | Body that is sent normally                  | `test/__snapshots__/<template>/<scenario>.html` |
| Aborted  | `abort_message` ran, so Braze does not send | `.../<scenario>.aborted.txt`                    |
| Error    | Parse or render failure                     | Test fails                                      |

Tests pin the `"now"` date to 2024-06-12 (Asia/Seoul). If you changed a template intentionally, update snapshots with `pnpm test -u`.

## Publishing

1. Bump `version` in `packages/vite-plugin-braze/package.json` and commit.
2. Publish from a terminal outside Claude Code, since npm 2FA browser authentication requires a TTY.
   ```sh
   pnpm --filter vite-plugin-braze publish --access public   # builds in prepublishOnly
   ```
3. Staged publishing is enabled, so the release becomes `latest` only after approval on npmjs.com. Until then, only a temporary `0.0.0-stage` version is visible.
4. Tag the published commit as `v<version>` and push the tag.

## Caveats

brazejs does not match Braze's implementation exactly (e.g. `url_escape`, `number_with_delimiter`). Do the final check in the Braze dashboard preview.
