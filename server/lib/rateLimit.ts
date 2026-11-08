// Ventana fija en memoria. Función pura: el store y el reloj se inyectan.
export type RateStore = Map<string, { count: number; resetAt: number }>

export function hit(store: RateStore, key: string, limit: number, windowMs: number, now: number) {
  let e = store.get(key)
  if (!e || now >= e.resetAt) {
    e = { count: 0, resetAt: now + windowMs }
    store.set(key, e)
  }
  if (e.count >= limit) return { allowed: false, retryAfterSec: Math.ceil((e.resetAt - now) / 1000) }
  e.count++
  return { allowed: true, retryAfterSec: 0 }
}
