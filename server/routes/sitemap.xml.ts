import { buildSitemap } from '../lib/sitemap'

export default defineEventHandler(async (event) => {
  const listings = await prisma.listing.findMany({
    where: { status: 'ACTIVE', deletedAt: null },
    select: { slug: true, updatedAt: true },
  })
  const entries = [
    ...['/', '/buscar', '/terminos', '/privacidad'].map((path) => ({ path })),
    ...listings.map((l) => ({ path: `/anuncio/${l.slug}`, lastmod: l.updatedAt })),
  ]
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return buildSitemap(useRuntimeConfig(event).public.appUrl, entries)
})
