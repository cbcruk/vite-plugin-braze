import { readFile } from 'node:fs/promises'
import type { ServerResponse } from 'node:http'
import { extname, resolve, sep } from 'node:path'
import type { Connect } from 'vite'

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
}

/** Writes `body` as a JSON response with the given status code. */
export function sendJson(res: ServerResponse, body: unknown, statusCode = 200): void {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

/**
 * Creates a middleware that serves the files under `dir`.
 *
 * The directory itself maps to its `index.html`. Missing files fall through to
 * the next middleware.
 */
export function serveStatic(dir: string): Connect.NextHandleFunction {
  return (req, res, next) => {
    const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname)
    const file = resolve(dir, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`)

    if (!file.startsWith(dir + sep)) {
      next()
      return
    }

    readFile(file).then(
      (body) => {
        res.setHeader('Content-Type', CONTENT_TYPES[extname(file)] ?? 'application/octet-stream')
        res.end(body)
      },
      () => next(),
    )
  }
}

/**
 * Keeps `res` open as a server-sent events stream.
 *
 * @returns A function that sends `data` to the client as one JSON-encoded event.
 */
export function openEventStream(res: ServerResponse): (data: unknown) => void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
  res.write(': connected\n\n')

  return (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)
}
