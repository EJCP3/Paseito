# Fase 1 — Seguridad

## Qué
Cerrar los agujeros que hoy permiten a cualquiera modificar o leer datos ajenos, y arreglar el 500 del filtro de precio. Sin features nuevas ni cambios de esquema de Prisma (eso es Fase 2).

## Cambios

**S1. Hotspots** — `server/api/tours/hotspots.put.ts`, `server/services/tour.service.ts`
- 401 sin sesión, 403 si la escena no es de un anuncio del usuario.
- Cada `targetSceneId` debe ser una escena del mismo anuncio (si no, 400).
- Máximo 50 hotspots por escena (`shared/schemas/tour.schema.ts`).

**S2. XSS en el visor** — `app/components/tour/TourViewer.client.vue`
- `title`, `text` de hotspots y `name` de escena se escapan antes de ir a `html:` / PSV. Helper puro `escapeHtml` en `shared/utils/`.

**S3. URLs de Cloudinary propias** — `server/services/storage.service.ts`
- Helper puro `isListingAssetUrl(url, cloudName, listingId)`: solo acepta `https://res.cloudinary.com/<cloudName>/image/upload/…/paseito/listings/<listingId>/…`.
- Se aplica en `POST /api/listings/:id/photos` (`url`, `thumbUrl`) y `POST /api/tours/scenes` (`panoramaUrl`, `previewUrl`). Si no cumple → 400.
- `deleteImage(url, listingId)` no destruye nada fuera de `paseito/listings/<listingId>/`.

**S4. Subidas** — `server/api/uploads/index.post.ts`, `server/services/image.service.ts`, `app/composables/useUpload.ts`
- Sin `content-length` → 411; `content-length` > 40 MB → 413 (antes de leer el cuerpo), y otra vez por tamaño real.
- `listingId` obligatorio y del usuario (403). Nada de carpeta `misc`.
- Formato real con Sharp: solo jpeg, png, webp (415).
- Campo `kind` = `photo` | `panorama`. Panorámica: proporción 1.8–2.2 y mínimo 4000×2000 (422; el cliente también lo bloquea). Cualquier imagen con un lado > 16384 px → 422. El cliente manda `kind`.

**S5. Visibilidad de anuncios** — `server/api/listings/index.get.ts`, `[id].get.ts`, `listing.schema.ts`
- El listado público siempre filtra `status: ACTIVE` (se quita `status` de los filtros públicos).
- El detalle devuelve 404 si no está `ACTIVE`, salvo que lo pida el dueño.
- `status` se quita de `UpdateListingSchema` (el dueño no se auto-publica por PATCH; se recupera con moderación en Fase 3).

**S6. Coordenadas aproximadas en la API** — `listing.service.ts`
- Para quien no es dueño, `latitude`/`longitude` salen redondeadas a 3 decimales (~110 m). El dueño las ve exactas. El círculo en el mapa va en Fase 4.
- Mismo criterio en favoritos (solo `ACTIVE`, coords públicas; añadir uno no ACTIVE → 404) y perfil público del vendedor. En el detalle, `nearbyPlaces[].distanceM` sale redondeado a 100 m para no dueños (`publicNearby`).

**S7. Rate limit** — `server/middleware/rate-limit.ts`
- Ventana fija en memoria por usuario (o IP sin sesión, sin confiar en `X-Forwarded-For`), solo para métodos de escritura en: `/api/uploads` (60/10 min), `POST /api/tours/scenes` exacto (30/10 min), `/api/geocode*` (20/min), `/api/listings/*/nearby-places*` y `/api/listings/nearby-places-preview` (10/min), `POST /api/listings` (10/hora). Excedido → 429 con `Retry-After`.
- Función pura `hit(key, limit, windowMs, now)` testeable.

**S8. Cabeceras** — `nuxt.config.ts` `routeRules`
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security` (solo en producción), `Permissions-Policy` (cámara/micro off; geolocalización solo self).

**S9. Bugs de validación** — `listing.service.ts`, endpoints tocados
- `maxPrice` construye `price: { gte, lte }` en un solo objeto. Extraer `buildListingWhere(filters)` como función pura.
- Errores de Zod → 400 (no 500) en los endpoints que se tocan. `minPrice=0` se respeta.

**S10. Sin datos falsos en producción** — `listing.service.ts`, `tour.service.ts`
- `useMock()` devuelve `false` siempre en producción. `getListingsByOwner` ya no cae a mock ante un error de BD.

## Criterios de terminado
- [x] `buildListingWhere`: solo `maxPrice`, `minPrice`+`maxPrice`, `minPrice=0`, siempre `ACTIVE` ← test
- [x] `escapeHtml` neutraliza `<img onerror>` y comillas ← test
- [x] `isListingAssetUrl`: acepta la propia, rechaza otro listing, otro cloud, otro host, `http`, path traversal ← test
- [x] Validación de imagen: rechaza svg/gif, panorámica 1:1 y 2:1 de baja resolución; acepta 4000×2000 jpeg ← test
- [x] Rate limit `hit`: permite N, bloquea N+1, reinicia tras la ventana ← test
- [x] Coordenadas: dueño exacto, otros a 3 decimales ← test
- [x] Hotspots PUT sin sesión → 401 contra el servidor dev ← fetch en el navegador contra el dev (curl no pasa por el proxy de la vista previa)
- [x] `GET /api/listings?status=DRAFT` solo devuelve `ACTIVE` ← fetch en el navegador contra el dev (curl no pasa por el proxy de la vista previa)
- [x] `GET /api/listings?maxPrice=100000` → 200 ← fetch en el navegador contra el dev (curl no pasa por el proxy de la vista previa)
- [x] Cabeceras presentes en `/` ← fetch en el navegador contra el dev (curl no pasa por el proxy de la vista previa)
- [x] `pnpm build` sin errores, `pnpm test` en verde
- [x] Detalle de un anuncio y el visor 360 se ven igual a 375px y 1440px ← captura
- [x] Revisión de code-reviewer y security-auditor sin hallazgos críticos/altos abiertos

## Fuera de alcance
- Consentimiento del teléfono y círculo de ubicación en el mapa (Fase 4, necesitan esquema/UI).
- CSP (riesgo alto de romper PSV/Leaflet/Cloudinary/fuentes; va con la auditoría de lanzamiento).
- Roles, moderación, admin (Fases 2–4). ESLint/typecheck/CI (Fase 0; aquí solo Vitest para estos tests).
- Rate limit distribuido (en memoria basta con una instancia).
