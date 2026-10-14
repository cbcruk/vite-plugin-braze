/**
 * Vite plugin that previews Braze Liquid templates with mock data scenarios.
 *
 * @example Basic usage
 * ```ts
 * import { defineConfig } from 'vite'
 * import { brazePreview } from 'vite-plugin-braze'
 *
 * export default defineConfig({
 *   plugins: [brazePreview({ root: 'templates' })],
 * })
 * ```
 *
 * @module
 */

export { brazePreview } from './plugin/braze-preview.ts'
export type { BrazePreviewOptions } from './plugin/braze-preview.types.ts'
export { listTemplates, TEMPLATE_FILE } from './catalog/catalog.ts'
export type { TemplateEntry } from './catalog/catalog.types.ts'
export { renderScenario } from './render/render.ts'
export type { RenderRequest, RenderResult } from './render/render.types.ts'
