import type { ServerResponse } from 'node:http'

/** Writes `body` as a JSON response with the given status code. */
export function sendJson(res: ServerResponse, body: unknown, statusCode = 200): void {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}
