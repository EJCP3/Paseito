export type SitemapEntry = { path: string; lastmod?: Date }

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

export function buildSitemap(appUrl: string, entries: SitemapEntry[]): string {
  const base = appUrl.replace(/\/+$/, '')
  const urls = entries
    .map((e) => `<url><loc>${esc(base + e.path)}</loc>${e.lastmod ? `<lastmod>${e.lastmod.toISOString().slice(0, 10)}</lastmod>` : ''}</url>`)
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
}
