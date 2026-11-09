// IP del cliente. ponytail: X-Forwarded-For solo es fiable detrás de un proxy de confianza,
// por eso se activa con TRUST_PROXY=1; sin proxy, cualquiera podría falsearla.
import type { H3Event } from 'h3'

export function clientIp(event: H3Event) {
  return getRequestIP(event, { xForwardedFor: process.env.TRUST_PROXY === '1' }) ?? 'unknown'
}
