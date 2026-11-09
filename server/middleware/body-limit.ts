// Límite de tamaño de cuerpo: readBody carga todo en memoria. Corre antes que rate-limit (orden alfabético).
// /api/uploads ya limita a 40 MB por su cuenta. El proxy debe poner su propio límite (41 MB uploads, 1 MB resto).
const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH'])
const MAX_BYTES = 1024 * 1024
const REQUIRES_LENGTH = /^\/api\/listings\/[^/]+\/(?:events|report)\/?$/

export default defineEventHandler((event) => {
  if (!BODY_METHODS.has(event.method)) return
  const path = getRequestURL(event).pathname
  if (path.startsWith('/api/uploads')) return

  const raw = getRequestHeader(event, 'content-length')
  if (raw === undefined) {
    if (REQUIRES_LENGTH.test(path)) throw createError({ statusCode: 411, statusMessage: 'Content-Length requerido' })
    return
  }
  const len = Number(raw)
  if (!Number.isFinite(len) || len < 0) throw createError({ statusCode: 400, statusMessage: 'Content-Length inválido' })
  if (len > MAX_BYTES) throw createError({ statusCode: 413, statusMessage: 'Cuerpo demasiado grande' })
})
