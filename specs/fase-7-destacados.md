# Fase 7 — Destacados (pago manual)

## Qué
Que el vendedor pueda promocionar un anuncio en tres espacios y que el hero de la home muestre anuncios reales (RQ-MONETIZE-01/02/03/04/06/07). Decisiones del usuario (2026-11-09):
- **Pago manual por ahora:** el vendedor solicita, paga fuera (transferencia/WhatsApp) y un admin confirma en `/admin`. Sin pasarela ni claves. Diseñado para conectar una pasarela después (el `paymentRef` único ya existe).
- **Precios en USD**, editables en un solo archivo: 7 días → Hero US$15, Rail US$8, Insignia US$5; 30 días → Hero US$50, Rail US$25, Insignia US$15.
- **Hero lleno = no se vende:** nunca más de 8 Hero activos; se informa la fecha en que se libera un espacio.

Sin migración: se usa el modelo `Feature` (Fase 2).

## Espacios
- `HERO`: uno de los 8 huecos del hero de la home.
- `SIDEBAR`: prioridad en el rail "Más anuncios" del detalle (aparecen primero) + etiqueta "Destacado".
- `BADGE`: etiqueta "Destacado" en las tarjetas (home, `/buscar`, favoritos) y prioridad dentro de `/buscar` con orden "recientes".

## Cambios

**F1. Reglas puras (TDD)** — `shared/config/featurePricing.ts`, `server/lib/features.ts`
- `FEATURE_PLANS`: `{ '7d': { days: 7, prices: { HERO: 1500, SIDEBAR: 800, BADGE: 500 } }, '30d': { days: 30, prices: { HERO: 5000, SIDEBAR: 2500, BADGE: 1500 } } }` (centavos, USD) + `PAYMENT_INSTRUCTIONS` (texto con marcadores `[BANCO]`, `[CUENTA]`, `[TITULAR]`, `[WHATSAPP DE PAGOS]`).
- `quote(placement, plan)` → `{ priceCents, currency: 'USD', days }` o error.
- `isActiveAt(f, now)`: `status === 'ACTIVE' && startsAt <= now < endsAt` (la expiración es por fecha en cada consulta: RQ-MONETIZE-04 sin cron).
- `heroCapacity(activeHeroEndDates: Date[], now, max = 8)` → `{ available: boolean, freeAt: Date | null }` (si está lleno, la fecha del primer `endsAt`).
- `nextFeatureAction(status, action: 'confirm' | 'cancel')`: `PENDING→ACTIVE` (confirm), `PENDING|ACTIVE→CANCELLED` (cancel); el resto error.
- `pickHeroListings(featured: L[], recent: L[], max = 8)`: primero los destacados (por `startsAt` desc), luego recientes sin repetir id, hasta `max`; solo anuncios con imagen.
- `revenueSummary(rows: { placement, priceCents, confirmedAt }[])` → totales por placement y por mes (`YYYY-MM`).

**F2. Vendedor** — `POST /api/features`, `GET /api/features/mine`, `/cuenta`
- `POST /api/features { listingId, placement, plan }`: `requireOwnedListing`, anuncio `ACTIVE`, sin otro `PENDING` o activo del mismo placement en ese anuncio, y para `HERO` hay hueco (`heroCapacity`; si no, 409 con `freeAt`). Crea `Feature { status: PENDING, priceCents, currency, startsAt: now, endsAt: now + days }` (fechas provisionales; se recalculan al confirmar). Rate limit 10/hora.
- `GET /api/features/hero-availability` (público): `{ available, freeAt }` para mostrarlo antes de pedir.
- `/cuenta`: botón **Promocionar** en anuncios activos → modal (tema claro, Escape, foco) con los 3 espacios × 2 planes y precio, disponibilidad del Hero, botón "Solicitar"; al solicitar muestra las instrucciones de pago (`PAYMENT_INSTRUCTIONS` + importe + referencia = id corto del Feature). En la tarjeta: "Destacado en Hero hasta 12 nov" / "Solicitud pendiente de pago" / cancelar solicitud pendiente.

**F3. Admin** — `/admin` pestaña **Destacados**, `GET /api/admin/features`, `PATCH /api/admin/features/:id`
- Lista pendientes primero (anuncio, vendedor, espacio, plan, importe, referencia), activos con fecha de fin, y vencidos/cancelados.
- `confirm { paymentRef }` (referencia del pago, obligatoria, única): en transacción, re-comprueba hueco de Hero, pone `ACTIVE`, `startsAt = now`, `endsAt = now + días del plan`, guarda `paymentRef`; `cancel { reason }`. Ambos con `AuditLog`.
- Resumen de ingresos (RQ-MONETIZE-06) por espacio y por mes con `revenueSummary` (solo confirmados).

**F4. Público**
- `GET /api/hero-listings`: siempre 8 si hay ≥ 8 anuncios activos con imagen (`pickHeroListings`), con `id, slug, title, coverUrl (cld f_auto,q_auto,c_limit,w_800)`. `BentoGalleryHero.vue` usa estos datos (mantener la animación Flip y el layout; con menos de 8 anuncios, rellenar con las imágenes estáticas actuales sin enlace). Al pulsar una imagen con anuncio → `/anuncio/<slug>` (revisar `handleHeroSelect` en `pages/index.vue`).
- `FeaturedBadge.vue` ("Destacado", discreto) en `ListingCard.vue` cuando el anuncio tiene SIDEBAR o BADGE activo. El listado público y el rail devuelven `featured: boolean` (subconsulta/`_count` de features activos) sin exponer precios ni fechas.
- `RelatedListingsRail`: anuncios con SIDEBAR activo primero.
- `/buscar` con orden `recent` (por defecto): anuncios con BADGE activo primero, luego el resto por fecha. (En `price_*` no se altera el orden.)

## Criterios de terminado
- [x] F1 cubierto ← test
- [x] Vendedor solicita (PENDING), ve instrucciones; no puede duplicar; Hero lleno → 409 con fecha ← navegador/API
- [x] Admin confirma con referencia → ACTIVE con fechas; referencia repetida → 409; cancelar; todo en Auditoría ← navegador
- [x] Hero de la home muestra el anuncio destacado y enlaza a su detalle; con el destacado vencido (fecha en el pasado) deja de aparecer ← navegador
- [x] Etiqueta "Destacado" en tarjetas SIDEBAR/BADGE; rail y `/buscar` priorizan ← navegador
- [x] Ingresos por espacio/mes en `/admin` ← navegador
- [x] lint, typecheck, test, build en verde; capturas 375/1440 de hero, modal Promocionar y pestaña Destacados
- [x] code-reviewer + security-auditor sin críticos/altos

## Ajustes tras la revisión
- Confirmar y solicitar Hero se serializan (`pg_advisory_xact_lock` + `Serializable`): probado con dos confirmaciones simultáneas con 7 ocupados → 200 + 409, quedan 8.
- Confirmar exige anuncio ACTIVE; la capacidad del Hero solo cuenta anuncios activos; máximo 5 solicitudes pendientes por usuario.
- `/cuenta` muestra cancelados (con motivo del admin) y vencidos de los últimos 90 días; la cancelación del vendedor queda en Auditoría.
- Ingresos = todo lo cobrado (con `paymentRef`), incluido lo cancelado después (se muestra aparte).
- `/api/hero-listings` en caché 60 s: un Hero recién confirmado puede tardar hasta 1 min en verse.

## Fuera de alcance
- Pasarela de pago y webhooks (Stripe/PayPal): siguiente fase cuando haya cuenta.
- Aviso por correo antes del vencimiento (RQ-MONETIZE-05): necesita cron.
- Datos bancarios reales: los rellena el usuario en `PAYMENT_INSTRUCTIONS`.
