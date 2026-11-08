import { describe, it, expect } from 'vitest'
import { hit } from '../server/lib/rateLimit'

type Store = Map<string, { count: number; resetAt: number }>
const WINDOW = 60_000

describe('hit', () => {
  it('permite N hits dentro de la ventana', () => {
    const store: Store = new Map()
    for (let i = 0; i < 3; i++) {
      expect(hit(store, 'u1', 3, WINDOW, 1000 + i).allowed).toBe(true)
    }
  })

  it('bloquea el hit N+1 con retryAfterSec > 0', () => {
    const store: Store = new Map()
    for (let i = 0; i < 3; i++) hit(store, 'u1', 3, WINDOW, 1000)
    const r = hit(store, 'u1', 3, WINDOW, 1000)
    expect(r.allowed).toBe(false)
    expect(r.retryAfterSec).toBeGreaterThan(0)
  })

  it('retryAfterSec refleja el tiempo restante de la ventana, redondeado hacia arriba', () => {
    const store: Store = new Map()
    hit(store, 'u1', 1, WINDOW, 0)
    const r = hit(store, 'u1', 1, WINDOW, 30_500)
    expect(r.allowed).toBe(false)
    expect(r.retryAfterSec).toBe(30) // 29.5 s restantes → 30
  })

  it('reinicia cuando now >= resetAt', () => {
    const store: Store = new Map()
    hit(store, 'u1', 1, WINDOW, 0)
    expect(hit(store, 'u1', 1, WINDOW, WINDOW - 1).allowed).toBe(false)
    expect(hit(store, 'u1', 1, WINDOW, WINDOW).allowed).toBe(true)
    expect(hit(store, 'u1', 1, WINDOW, WINDOW + 1).allowed).toBe(false)
  })

  it('tras reiniciar vuelve a permitir N completos', () => {
    const store: Store = new Map()
    for (let i = 0; i < 4; i++) hit(store, 'u1', 3, WINDOW, 0)
    for (let i = 0; i < 3; i++) expect(hit(store, 'u1', 3, WINDOW, WINDOW + 10).allowed).toBe(true)
    expect(hit(store, 'u1', 3, WINDOW, WINDOW + 10).allowed).toBe(false)
  })

  it('las claves son independientes', () => {
    const store: Store = new Map()
    hit(store, 'u1', 1, WINDOW, 0)
    expect(hit(store, 'u1', 1, WINDOW, 0).allowed).toBe(false)
    expect(hit(store, 'u2', 1, WINDOW, 0).allowed).toBe(true)
  })

  it('un hit permitido devuelve retryAfterSec 0', () => {
    const store: Store = new Map()
    expect(hit(store, 'u1', 5, WINDOW, 0)).toEqual({ allowed: true, retryAfterSec: 0 })
  })
})
