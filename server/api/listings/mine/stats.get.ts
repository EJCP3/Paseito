// GET /api/listings/mine/stats?days=30 — Resumen de analítica de todos mis anuncios (una sola consulta)
// → { [listingId]: { views, contactClicks, avgTourSeconds } }
export default defineEventHandler(async (event) => {
  const session = await requireUser(event)
  const q = Number(getQuery(event).days)
  const days = [7, 30, 90].includes(q) ? q : 30
  const since = new Date(Date.now() - (days + 1) * 86_400_000)

  const rows = await prisma.$queryRaw<{ listingId: string; views: number; contactClicks: number; avgTourSeconds: number }[]>`
    SELECT e."listingId" AS "listingId",
           count(*) FILTER (WHERE e."type" = 'VIEW')::int AS "views",
           count(*) FILTER (WHERE e."type" = 'CONTACT_CLICK')::int AS "contactClicks",
           coalesce(round(avg(e."value") FILTER (WHERE e."type" = 'TOUR_TIME')), 0)::int AS "avgTourSeconds"
    FROM "ListingEvent" e
    JOIN "Listing" l ON l."id" = e."listingId"
    WHERE l."ownerId" = ${session.user.id} AND l."deletedAt" IS NULL
      AND e."createdAt" >= ${since}
      AND date_trunc('day', e."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Santo_Domingo')
          >= date_trunc('day', now() AT TIME ZONE 'America/Santo_Domingo') - make_interval(days => ${days - 1}::int)
    GROUP BY e."listingId"`

  return Object.fromEntries(rows.map((r) => [r.listingId, { views: r.views, contactClicks: r.contactClicks, avgTourSeconds: r.avgTourSeconds }]))
})
