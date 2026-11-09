// Reglas puras de destacados (sin Nuxt ni Prisma, testeable)
import { FEATURE_PLANS, type FeaturePlacementKey, type FeaturePlanKey } from '../../shared/config/featurePricing'

type Fail = { ok: false; reason: string }

export function quote(placement: FeaturePlacementKey, plan: FeaturePlanKey):
  { ok: true; priceCents: number; currency: 'USD'; days: number } | Fail {
  if (!Object.hasOwn(FEATURE_PLANS, plan)) return { ok: false, reason: 'Plan no válido' }
  const p = FEATURE_PLANS[plan]
  if (!Object.hasOwn(p.prices, placement)) return { ok: false, reason: 'Espacio no válido' }
  return { ok: true, priceCents: p.prices[placement], currency: 'USD', days: p.days }
}

// La expiración es por fecha en cada consulta: sin cron (RQ-MONETIZE-04)
export function isActiveAt(f: { status: string; startsAt: Date; endsAt: Date }, now: Date): boolean {
  return f.status === 'ACTIVE' && f.startsAt <= now && now < f.endsAt
}

export function heroCapacity(activeHeroEndDates: Date[], now: Date, max = 8): { available: boolean; freeAt: Date | null } {
  const live = activeHeroEndDates.filter((d) => d > now).sort((a, b) => a.getTime() - b.getTime())
  if (live.length < max) return { available: true, freeAt: null }
  return { available: false, freeAt: live[live.length - max]! } // con max activos: el primero que vence
}

export function nextFeatureAction(status: string, action: 'confirm' | 'cancel'): { ok: true; status: 'ACTIVE' | 'CANCELLED' } | Fail {
  if (action === 'confirm' && status === 'PENDING') return { ok: true, status: 'ACTIVE' }
  if (action === 'cancel' && (status === 'PENDING' || status === 'ACTIVE')) return { ok: true, status: 'CANCELLED' }
  return { ok: false, reason: 'Acción no válida para el estado actual' }
}

type HeroItem = { id: string; coverUrl?: string | null; startsAt?: Date }

export function pickHeroListings<T extends HeroItem>(featured: T[], recent: T[], max = 8): T[] {
  const byStart = [...featured].sort((a, b) => (b.startsAt?.getTime() ?? 0) - (a.startsAt?.getTime() ?? 0))
  const seen = new Set<string>()
  const out: T[] = []
  for (const l of [...byStart, ...recent]) {
    if (out.length >= max) break
    if (!l.coverUrl || seen.has(l.id)) continue
    seen.add(l.id)
    out.push(l)
  }
  return out
}

export function revenueSummary(rows: { placement: string; priceCents: number; confirmedAt: Date }[]) {
  const byPlacement: Record<FeaturePlacementKey, number> = { HERO: 0, SIDEBAR: 0, BADGE: 0 }
  const months = new Map<string, number>()
  let total = 0
  for (const r of rows) {
    total += r.priceCents
    if (Object.hasOwn(byPlacement, r.placement)) byPlacement[r.placement as FeaturePlacementKey] += r.priceCents
    const m = r.confirmedAt.toISOString().slice(0, 7) // UTC
    months.set(m, (months.get(m) ?? 0) + r.priceCents)
  }
  const byMonth = [...months].sort(([a], [b]) => a.localeCompare(b)).map(([month, t]) => ({ month, total: t }))
  return { total, byPlacement, byMonth }
}
