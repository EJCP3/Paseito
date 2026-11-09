// IP del cliente. Con IP_HEADER (p. ej. x-real-ip, cf-connecting-ip, x-vercel-forwarded-for) se lee esa
// cabecera, que debe fijarla la plataforma/proxy sobrescribiendo lo del cliente. Sin IP_HEADER se usa la IP
// del socket (X-Forwarded-For nunca se confía: lo controla el cliente).
import type { H3Event } from 'h3'

export function clientIp(event: H3Event) {
  const header = process.env.IP_HEADER
  if (header) {
    const v = getRequestHeader(event, header)?.split(',')[0]?.trim()
    if (v) return v
  }
  return getRequestIP(event) ?? 'unknown'
}
