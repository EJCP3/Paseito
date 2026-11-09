export default defineEventHandler((event) => {
  const appUrl = useRuntimeConfig(event).public.appUrl.replace(/\/+$/, '')
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return `User-agent: *\nDisallow: /admin\nDisallow: /cuenta\nDisallow: /publicar\nDisallow: /api/\nSitemap: ${appUrl}/sitemap.xml\n`
})
