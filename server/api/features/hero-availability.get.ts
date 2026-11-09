// GET /api/features/hero-availability (público) — ¿hay hueco en el Hero?
import { heroCapacity } from '~~/server/lib/features'
import { heroOccupiedWhere } from '~~/server/lib/featureWhere'

export default defineEventHandler(async () => {
  const now = new Date()
  const active = await prisma.feature.findMany({ where: heroOccupiedWhere(now), select: { endsAt: true } })
  return heroCapacity(active.map((a) => a.endsAt), now)
})
