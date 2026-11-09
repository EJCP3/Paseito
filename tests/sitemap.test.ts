import { describe, it, expect } from 'vitest'
import { buildSitemap } from '../server/lib/sitemap'

const APP = 'https://paseito.do'

describe('buildSitemap', () => {
  it('empieza con la cabecera XML', () => {
    expect(buildSitemap(APP, []).startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
  })

  it('urlset declara el namespace de sitemaps.org', () => {
    expect(buildSitemap(APP, [])).toMatch(/<urlset[^>]*xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/)
  })

  it('un <url><loc> por entrada', () => {
    const xml = buildSitemap(APP, [{ path: '/' }, { path: '/buscar' }, { path: '/anuncio/a' }])
    expect(xml.match(/<url>/g)).toHaveLength(3)
    expect(xml).toContain(`<loc>${APP}/buscar</loc>`)
    expect(xml).toContain(`<loc>${APP}/anuncio/a</loc>`)
  })

  it('no genera doble barra si appUrl termina en /', () => {
    const xml = buildSitemap(`${APP}/`, [{ path: '/buscar' }])
    expect(xml).toContain(`<loc>${APP}/buscar</loc>`)
    expect(xml).not.toContain('.do//')
  })

  it('lastmod en formato YYYY-MM-DD cuando viene', () => {
    const xml = buildSitemap(APP, [{ path: '/anuncio/a', lastmod: new Date('2026-03-05T22:10:00Z') }])
    expect(xml).toContain('<lastmod>2026-03-05</lastmod>')
  })

  it('sin lastmod no emite la etiqueta', () => {
    expect(buildSitemap(APP, [{ path: '/' }])).not.toContain('<lastmod>')
  })

  it(`escapa & < > " ' en loc`, () => {
    const xml = buildSitemap(APP, [{ path: `/anuncio/a&b<c>"d'e` }])
    expect(xml).toContain(`<loc>${APP}/anuncio/a&amp;b&lt;c&gt;&quot;d&apos;e</loc>`)
  })
})
