// GET /api/listings/:id/stats?days=30 — Estadísticas agregadas del anuncio (dueño o admin)
import { summarizeEvents, type EventRow } from '~~/server/lib/analytics'

export default defineEventHandler(async (event) => {
  const session = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID requerido' })

  if (session.user.role === 'ADMIN') {
    const l = await prisma.listing.findUnique({ where: { id }, select: { deletedAt: true } })
    if (!l || l.deletedAt) throw createError({ statusCode: 404, statusMessage: 'Anuncio no encontrado' })
  } else {
    await requireOwnedListing(id, session.user.id)
  }

  const q = Number(getQuery(event).days)
  const days = [7, 30, 90].includes(q) ? q : 30
  // Prefiltro por índice (margen de 1 día) + rango exacto en días de República Dominicana
  const since = new Date(Date.now() - (days + 1) * 86_400_000)

  // Agregación en BD; solo parámetros ligados. Para CONTACT_CLICK, value es el índice de canal.
  const rows = await prisma.$queryRaw<EventRow[]>`
    SELECT to_char(date_trunc('day', "createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Santo_Domingo'), 'YYYY-MM-DD') AS "day",
           "type"::text AS "type",
           CASE WHEN "type" = 'CONTACT_CLICK' THEN "value" END AS "channelIndex",
           count(*)::int AS "count",
           coalesce(sum("value"), 0)::int AS "sumValue"
    FROM "ListingEvent"
    WHERE "listingId" = ${id} AND "createdAt" >= ${since}
      AND date_trunc('day', "createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Santo_Domingo')
          >= date_trunc('day', now() AT TIME ZONE 'America/Santo_Domingo') - make_interval(days => ${days - 1}::int)
    GROUP BY 1, 2, 3`

  return { ...summarizeEvents(rows), days }
})
