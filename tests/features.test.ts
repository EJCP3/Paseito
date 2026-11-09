import { describe, it, expect } from 'vitest'
import {
  quote,
  isActiveAt,
  heroCapacity,
  nextFeatureAction,
  pickHeroListings,
  revenueSummary,
} from '../server/lib/features'

const now = new Date('2026-11-09T12:00:00Z')
const at = (iso: string) => new Date(iso)
const plusDays = (d: number) => new Date(now.getTime() + d * 86_400_000)

function expectFail(r: { ok: boolean; reason?: string }) {
  expect(r.ok).toBe(false)
  expect(typeof (r as any).reason).toBe('string')
  expect((r as any).reason.trim().length).toBeGreaterThan(0)
}

describe('quote', () => {
  it.each([
    ['HERO', '7d', 1500, 7],
    ['SIDEBAR', '7d', 800, 7],
    ['BADGE', '7d', 500, 7],
    ['HERO', '30d', 5000, 30],
    ['SIDEBAR', '30d', 2500, 30],
    ['BADGE', '30d', 1500, 30],
  ])('%s + %s cuesta %i centavos USD por %i días', (placement, plan, priceCents, days) => {
    expect(quote(placement as any, plan as any)).toEqual({ ok: true, priceCents, currency: 'USD', days })
  })

  it('rechaza un placement desconocido', () => {
    expectFail(quote('FOOTER' as any, '7d'))
  })

  it('rechaza un plan desconocido', () => {
    expectFail(quote('HERO', '14d' as any))
  })

  it('no acepta claves heredadas del prototipo como plan o placement', () => {
    expectFail(quote('HERO', 'toString' as any))
    expectFail(quote('constructor' as any, '7d'))
  })
})

describe('isActiveAt', () => {
  const f = { status: 'ACTIVE', startsAt: at('2026-11-01T00:00:00Z'), endsAt: at('2026-11-15T00:00:00Z') }

  it('es true dentro del rango con status ACTIVE', () => {
    expect(isActiveAt(f, now)).toBe(true)
  })

  it('es true exactamente en startsAt', () => {
    expect(isActiveAt(f, f.startsAt)).toBe(true)
  })

  it('es false exactamente en endsAt', () => {
    expect(isActiveAt(f, f.endsAt)).toBe(false)
  })

  it('es false después de endsAt', () => {
    expect(isActiveAt(f, at('2026-11-20T00:00:00Z'))).toBe(false)
  })

  it('es false antes de startsAt', () => {
    expect(isActiveAt(f, at('2026-10-31T23:59:59Z'))).toBe(false)
  })

  it.each(['PENDING', 'CANCELLED'])('es false con status %s aunque esté en rango', (status) => {
    expect(isActiveAt({ ...f, status }, now)).toBe(false)
  })
})

describe('heroCapacity', () => {
  it('con 0 activos hay hueco y freeAt es null', () => {
    expect(heroCapacity([], now)).toEqual({ available: true, freeAt: null })
  })

  it('con 7 activos hay hueco y freeAt es null', () => {
    const ends = Array.from({ length: 7 }, (_, i) => plusDays(i + 1))
    expect(heroCapacity(ends, now)).toEqual({ available: true, freeAt: null })
  })

  it('con 8 activos está lleno y freeAt es la fecha más próxima', () => {
    const ends = [5, 3, 8, 2, 7, 4, 6, 9].map(plusDays)
    expect(heroCapacity(ends, now)).toEqual({ available: false, freeAt: plusDays(2) })
  })

  it('ignora fechas ya pasadas o iguales a now', () => {
    const ends = [...Array.from({ length: 7 }, (_, i) => plusDays(i + 1)), plusDays(-1), now]
    expect(heroCapacity(ends, now)).toEqual({ available: true, freeAt: null })
  })

  it('respeta un max personalizado', () => {
    expect(heroCapacity([plusDays(3), plusDays(1)], now, 2)).toEqual({ available: false, freeAt: plusDays(1) })
  })
})

describe('nextFeatureAction', () => {
  it('PENDING + confirm pasa a ACTIVE', () => {
    expect(nextFeatureAction('PENDING', 'confirm')).toEqual({ ok: true, status: 'ACTIVE' })
  })

  it.each(['PENDING', 'ACTIVE'])('%s + cancel pasa a CANCELLED', (status) => {
    expect(nextFeatureAction(status, 'cancel')).toEqual({ ok: true, status: 'CANCELLED' })
  })

  it('ACTIVE + confirm falla', () => {
    expectFail(nextFeatureAction('ACTIVE', 'confirm'))
  })

  it.each(['confirm', 'cancel'])('CANCELLED + %s falla', (action) => {
    expectFail(nextFeatureAction('CANCELLED', action as any))
  })

  it('una acción desconocida falla', () => {
    expectFail(nextFeatureAction('PENDING', 'delete' as any))
  })
})

describe('pickHeroListings', () => {
  const L = (id: string, extra: Record<string, unknown> = {}) => ({ id, coverUrl: `https://img/${id}.jpg`, ...extra })

  it('pone primero los destacados ordenados por startsAt desc', () => {
    const featured = [
      L('a', { startsAt: at('2026-11-01T00:00:00Z') }),
      L('b', { startsAt: at('2026-11-05T00:00:00Z') }),
      L('c', { startsAt: at('2026-11-03T00:00:00Z') }),
    ]
    expect(pickHeroListings(featured, []).map((x) => x.id)).toEqual(['b', 'c', 'a'])
  })

  it('después añade recientes en su orden sin repetir ids', () => {
    const featured = [L('a', { startsAt: at('2026-11-01T00:00:00Z') })]
    const recent = [L('r1'), L('a'), L('r2')]
    expect(pickHeroListings(featured, recent).map((x) => x.id)).toEqual(['a', 'r1', 'r2'])
  })

  it('excluye elementos sin coverUrl', () => {
    const featured = [{ id: 'f', coverUrl: null, startsAt: now } as any]
    const recent = [L('r1'), { id: 'r2', coverUrl: '' } as any, { id: 'r3' } as any, L('r4')]
    expect(pickHeroListings(featured, recent).map((x) => x.id)).toEqual(['r1', 'r4'])
  })

  it('corta en max (8 por defecto)', () => {
    const recent = Array.from({ length: 12 }, (_, i) => L(`r${i}`))
    expect(pickHeroListings([], recent)).toHaveLength(8)
    expect(pickHeroListings([], recent, 3).map((x) => x.id)).toEqual(['r0', 'r1', 'r2'])
  })

  it('si hay menos que max devuelve los que haya', () => {
    expect(pickHeroListings([L('a', { startsAt: now })], [L('r1')]).map((x) => x.id)).toEqual(['a', 'r1'])
  })

  it('con listas vacías devuelve []', () => {
    expect(pickHeroListings([], [])).toEqual([])
  })

  it('no muta la lista de destacados', () => {
    const featured = [L('a', { startsAt: at('2026-11-01T00:00:00Z') }), L('b', { startsAt: at('2026-11-05T00:00:00Z') })]
    pickHeroListings(featured, [])
    expect(featured.map((x) => x.id)).toEqual(['a', 'b'])
  })
})

describe('revenueSummary', () => {
  it('sin filas devuelve ceros con las 3 claves y byMonth vacío', () => {
    expect(revenueSummary([])).toEqual({ total: 0, byPlacement: { HERO: 0, SIDEBAR: 0, BADGE: 0 }, byMonth: [] })
  })

  it('suma total, por placement y por mes ordenado asc', () => {
    const rows = [
      { placement: 'HERO', priceCents: 5000, confirmedAt: at('2026-11-02T10:00:00Z') },
      { placement: 'BADGE', priceCents: 500, confirmedAt: at('2026-09-15T10:00:00Z') },
      { placement: 'HERO', priceCents: 1500, confirmedAt: at('2026-09-20T10:00:00Z') },
      { placement: 'BADGE', priceCents: 1500, confirmedAt: at('2026-11-30T10:00:00Z') },
    ]
    expect(revenueSummary(rows)).toEqual({
      total: 8500,
      byPlacement: { HERO: 6500, SIDEBAR: 0, BADGE: 2000 },
      byMonth: [
        { month: '2026-09', total: 2000 },
        { month: '2026-11', total: 6500 },
      ],
    })
  })

  it('agrupa por mes en UTC, no en hora local', () => {
    const rows = [
      { placement: 'SIDEBAR', priceCents: 800, confirmedAt: at('2026-10-31T23:30:00Z') },
      { placement: 'SIDEBAR', priceCents: 800, confirmedAt: at('2026-11-01T00:30:00Z') },
    ]
    expect(revenueSummary(rows).byMonth).toEqual([
      { month: '2026-10', total: 800 },
      { month: '2026-11', total: 800 },
    ])
  })

  it('ordena meses de años distintos cronológicamente', () => {
    const rows = [
      { placement: 'HERO', priceCents: 1500, confirmedAt: at('2027-01-05T00:00:00Z') },
      { placement: 'HERO', priceCents: 1500, confirmedAt: at('2026-12-05T00:00:00Z') },
    ]
    expect(revenueSummary(rows).byMonth.map((m) => m.month)).toEqual(['2026-12', '2027-01'])
  })
})
