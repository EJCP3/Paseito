# Fase 5 — Búsqueda, SEO y rendimiento

## Qué
Búsqueda real en servidor con página `/buscar` (grilla + mapa), anuncios que se compartan bien en redes y buscadores, y menos peso inicial. Sin cambios de esquema.

Línea base (build de la Fase 4, `.output/public/_nuxt`): JS total ≈ 507 KB gzip; chunk de entrada ≈ 209 KB gzip (580 KB raw); chunk three/PSV ≈ 172 KB gzip; CSS de entrada 31 KB gzip (158 KB raw). Google Fonts por `@import` con 32 pesos.

## Parte A — Búsqueda (RQ-SEARCH-01/02/03/04)

**A1. Filtros en servidor** — `shared/schemas/listing.schema.ts` (`ListingFiltersSchema`), `server/lib/listingWhere.ts`, `server/api/listings/index.get.ts`
- Filtros: `type`, `mode`, `city`, `sector`, `minPrice`, `maxPrice`, `minBedrooms`, `minBathrooms`, `minArea`, `maxArea`, `search` (título, descripción, ciudad, sector; `contains` insensible), `sort` ∈ `recent` (defecto) | `price_asc` | `price_desc`, `page`, `limit` (máx 48).
- `buildListingOrderBy(sort)` puro. El listado público devuelve solo los campos que pinta la tarjeta (`select`: id, slug, type, mode, title, price, currency, city, sector, bedrooms, bathrooms, areaM2, latitude, longitude, ownerId, createdAt, primera foto `thumbUrl`, primera escena `previewUrl`), sin `description` ni `contacts`.

**A2. Página `/buscar`** — `app/pages/buscar.vue`, `app/components/search/*`
- Estado de filtros en la URL (`?city=&type=&…`), compartible y con back/forward. Cambiar un filtro reemplaza la query y vuelve a pedir (debounce 300 ms en texto).
- Vista **Grilla** (`ListingCard`, paginación "Cargar más") y vista **Mapa** (Leaflet, cada anuncio como círculo de ~300 m sobre su coordenada pública; al tocarlo, tarjeta del anuncio). Alternar con un control accesible (`role="tablist"`).
- Panel de filtros: en móvil, hoja inferior; en escritorio, barra lateral. Reutiliza el lenguaje visual de la isla de filtros de la home.
- `EmptyState.vue` reutilizable: mensaje + "Quitar filtros" cuando no hay resultados (RQ-SEARCH-04).
- Skeletons mientras carga (reutiliza el de `ProductSession`).

**A3. Home** — `app/components/ProductSession.vue`
- Los filtros de la isla consultan el servidor (mismos parámetros que A1) en vez de filtrar 48 anuncios en el cliente. "Ver todo"/el destino que hoy hace `router.push('/buscar')` lleva a `/buscar` con los filtros activos.
- `<img>` de la grilla con `loading="lazy" decoding="async"` y `width/height`.
- La animación de `width` de `.island` pasa a `transform`/`clip-path` (regla de animaciones).

## Parte B — SEO (RQ-SEO-01/02/03)

**B1. Meta del detalle** — `app/pages/anuncio/[slug].vue`
- `useSeoMeta`: `title`, `description` (recortada a ~155), `ogTitle`, `ogDescription`, `ogImage` (primera foto o preview 360, URL de Cloudinary con `w_1200,h_630,c_fill,f_jpg,q_auto`), `ogType: 'website'`, `ogUrl` canónica, `twitterCard: 'summary_large_image'`. `link rel=canonical`.
- JSON-LD (`useHead` script `application/ld+json`) generado por función pura `listingJsonLd(listing, appUrl)`: `@type` `Residence`/`Apartment`/`House` según tipo + `offers` (`Offer` con `price`, `priceCurrency`, `availability`), `address` (`addressLocality`, `addressRegion` = sector), `geo` con la coordenada **pública** (redondeada), `image`. Escapar `</script>` en el JSON.

**B2. Sitemap** — `server/routes/sitemap.xml.ts`
- Función pura `buildSitemap(appUrl, entries)` → XML válido (escapa `&<>"'`). Entradas: `/`, `/buscar`, `/terminos`, `/privacidad`, y cada anuncio ACTIVE no borrado (`/anuncio/<slug>`, `lastmod` = `updatedAt`). `Content-Type: application/xml`, cache 1 h.
- `public/robots.txt`: añadir `Sitemap: <APP_URL>/sitemap.xml` (si `robots.txt` es estático, generarlo en `server/routes/robots.txt.ts` con `appUrl`). `Disallow: /admin /cuenta /publicar`.

## Parte C — Rendimiento (auditoría de la Fase de diagnóstico)

**C1. Fuentes** — quitar el `@import` de Google Fonts de `main.css`; cargar solo los pesos usados (comprobar con grep de `font-weight`/clases: probablemente 400/500/600/700 de Plex Sans y 400/600/700 de Plex Mono, sin itálicas salvo uso real) con `@nuxt/fonts` (preferido, autoaloja) o `<link rel="preconnect">` + `<link rel="stylesheet">` en `app.head`.

**C2. CSS/JS globales a local**
- `app/plugins/vcalendar.client.ts` fuera: importar `DatePicker`/`Calendar` y su CSS dentro de los componentes de disponibilidad.
- `leaflet/dist/leaflet.css` fuera de `css` global: importarlo en los componentes que usan Leaflet.
- `<LazyTourViewer>` en el detalle (y `hydrate-on-visible` si aplica) y `await import('glimm')` dentro de `sweep()` en `useGlimmSweep.ts`.

**C3. Imágenes**
- Helper puro `cld(url, transform)` (`shared/utils/cloudinary.ts`) que inserta la transformación tras `/upload/` solo en URLs de Cloudinary (idempotente si ya hay transformación). Foto principal del detalle `f_auto,q_auto,w_1600`; panorámica del visor `q_auto,w_4096`; tarjetas `f_auto,q_auto,w_600`.
- `<img>` LCP (hero y foto principal) con `fetchpriority="high"`, `width/height`; el resto `loading="lazy"`.

**C4. Interacción**
- `BentoGalleryHero.vue`: debounce 150 ms del Flip en `resize`.
- `RelatedListingsRail.vue`: leer el rect una vez por frame (`requestAnimationFrame`) en `mousemove`.
- Rail del detalle montado una sola vez (no dos ocultando con CSS).

## Criterios de terminado
- [x] `buildListingWhere`/`buildListingOrderBy` con los filtros nuevos; `listingJsonLd`; `buildSitemap`; `cld` ← test
- [x] `/buscar`: filtros en URL, grilla y mapa, vacío con "Quitar filtros", back/forward ← navegador 375/1440
- [x] Home: filtros consultan el servidor; botón a `/buscar` con filtros ← navegador
- [x] Detalle: OG/Twitter/canonical/JSON-LD presentes en el HTML del servidor (curl/fetch del HTML) ← comando
- [x] `/sitemap.xml` válido con anuncios activos; `robots.txt` con Sitemap ← comando
- [x] JS de entrada y CSS de entrada menores que la línea base; sin `@import` de fuentes ← build
- [ ] Visor 360, mapa, calendario de villas y sweep de publicar siguen funcionando ← **pendiente**: el panel del navegador estaba oculto (sin requestAnimationFrame no montan); revisado solo por código
- [x] lint, typecheck, test, build en verde; code-reviewer y web-performance-auditor sin bloqueantes

## Resultado medido (build de producción)
- Entry JS: 580 → 375 KB raw; **209 → 142 KB gzip (−32 %)**. CSS de entrada: 158 → 122 KB raw; 31 → 20 KB gzip. Sin Google Fonts (Plex Sans 400–700 y Plex Mono 600/700 autoalojadas).
- Ruta del detalle ≈ 10 KB gzip; mapa y calendario solo al abrir su acordeón; three/PSV en chunk aparte.

## Siguiente (no hecho)
- Sacar GSAP del entry (plugin global → imports locales): ~40–50 KB gzip estimados.
- `srcset` responsive en el hero de la home.

## Fuera de alcance
- Índice de texto completo (pg_trgm): con el volumen actual `contains` basta; añadir cuando haya miles de anuncios.
- Lighthouse/CrUX de producción (no hay despliegue).
- Tracking de eventos y analítica (Fase 6).
