# Fase 6 — Analítica de anuncios

## Qué
Medir si Paseito cumple su objetivo (que el visitante llegue al contacto del vendedor) y enseñárselo al vendedor (RQ-ANALYTICS-01 P0, RQ-ANALYTICS-02 P2). Se usa la tabla propia `ListingEvent` (Fase 2): sin herramienta externa, sin cookies de seguimiento, sin guardar IP ni usuario. No hay migración.

## Cambios

**E1. Reglas puras** — `server/lib/analytics.ts` (TDD)
- `EventInputSchema` (Zod, en `shared/schemas/event.schema.ts`): `type` ∈ `VIEW | CONTACT_CLICK | TOUR_OPEN | TOUR_TIME` (el cliente no puede enviar `SCHEDULE_CLICK`: no existe el botón "Agendar visita"; queda reservado). `value` entero 1–3600 obligatorio solo en `TOUR_TIME` (segundos, recortado a 3600); prohibido en el resto. `channel` obligatorio en `CONTACT_CLICK` ∈ `whatsapp | instagram | facebook | tiktok | website` (prohibido en el resto; cómo se guarda, en E2).
- `dedupeKey(visitorHash, listingId, type)` y `shouldRecord(store, key, now, windowMs)`: un mismo visitante cuenta como máximo 1 `VIEW` y 1 `TOUR_OPEN` por anuncio cada 30 min; `CONTACT_CLICK` cada 5 min por canal; `TOUR_TIME` sin dedupe (cada visita suma tiempo). Store en memoria con limpieza (como `rateLimit`).
- `visitorHash(ip, userAgent, daySalt)`: SHA-256 truncado; la sal cambia cada día (`YYYY-MM-DD` + `BETTER_AUTH_SECRET`), así que no permite seguir a nadie entre días ni se guarda en BD.
- `summarizeEvents(rows)` → `{ views, contactClicks, tourOpens, avgTourSeconds, byDay: { date, views, contactClicks }[] }` a partir de filas agregadas.

**E2. Endpoint** — `server/api/listings/[id]/events.post.ts`
- Público (sin sesión obligatoria). 204 siempre que el cuerpo sea válido aunque se descarte por dedupe (no revela nada). 400 si el cuerpo no valida. 404 si el anuncio no está ACTIVE o está borrado.
- No registra eventos del propio dueño (sesión opcional: si `ownerId === userId` → 204 sin guardar).
- `CONTACT_CLICK`: el canal se guarda en `value` como índice (0 whatsapp, 1 instagram, 2 facebook, 3 tiktok, 4 website) — sin migración. Documentarlo en el código.
- Rate limit: añadir regla `events` (POST `/api/listings/*/events`, 120 por 10 min por IP/usuario) al middleware.

**E3. Cliente** — `app/composables/useListingEvents.ts`, `anuncio/[slug].vue`, `TourViewer.client.vue`
- `track(listingId, type, extra?)` con `navigator.sendBeacon` (fallback `fetch` con `keepalive`); nunca bloquea ni muestra errores.
- `VIEW` al montar el detalle (solo cliente; no en SSR, no cuenta bots que no ejecutan JS).
- `CONTACT_CLICK` al pulsar cada enlace de contacto (WhatsApp de ambos sitios, redes y web), con su canal; el enlace se abre igual.
- `TOUR_OPEN` cuando el visor está listo (evento `ready`) la primera vez.
- `TOUR_TIME`: tiempo con el visor **visible** (pausa con `visibilitychange` oculto), enviado en `pagehide`/`visibilitychange→hidden` y al salir de la página; mínimo 3 s para enviarlo.
- Respeta `navigator.doNotTrack === '1'` / `globalPrivacyControl`: no envía nada.

**E4. Panel del vendedor (RQ-ANALYTICS-02)** — `GET /api/listings/:id/stats?days=30` + `/cuenta`
- Solo el dueño (`requireOwnedListing`) o un admin. `days` ∈ 7 | 30 | 90 (defecto 30). Agregación en BD (`groupBy` por tipo y por día), no traer filas sueltas.
- En `/cuenta`, cada anuncio activo/pausado muestra en una línea: vistas, contactos y tiempo medio en el tour (30 días); botón "Ver estadísticas" abre un panel con la serie diaria (vistas y contactos) como barras simples SVG/CSS, sin librería de gráficos, y desglose de contactos por canal.
- Admin (opcional si cabe): en `/admin` → Anuncios, mostrar vistas/contactos 30 días en cada tarjeta.

**E5. Privacidad**
- Política de privacidad (`/privacidad`): actualizar la sección de estadísticas con lo que se mide, que no se guarda IP ni usuario, la sal diaria, y que se respeta Do Not Track / GPC.
- Retención: tarea/función `purgeOldEvents(days = 395)` llamable desde un script `scripts/purge-events.ts` (no hay cron en esta fase).

## Criterios de terminado
- [x] Schema de evento, dedupe, `visitorHash` (sal diaria cambia el hash), `summarizeEvents` ← test
- [x] Abrir un anuncio 2 veces seguidas → 1 VIEW; el dueño no genera eventos ← navegador + BD
- [x] Clic en WhatsApp → CONTACT_CLICK con canal; el enlace sigue abriendo wa.me ← navegador
- [x] Abrir el visor → TOUR_OPEN; salir tras ≥3 s → TOUR_TIME con segundos razonables ← navegador
- [x] Con DNT activo no se envía nada ← navegador
- [x] `/cuenta` muestra estadísticas y el panel diario a 375 y 1440 px ← captura
- [x] `/stats` de anuncio ajeno → 403/404 ← API
- [x] lint, typecheck, test, build en verde; code-reviewer + security-auditor sin críticos/altos

## Ajustes tras la revisión
- Eventos desde otros orígenes → 403 (`Sec-Fetch-Site`/`Origin`).
- Visitante = IP normalizada (IPv6 /64), sin UA; `TOUR_TIME` también deduplicado 30 min y un solo envío por visita.
- Sal propia (`analytics:` + secreto); sin secreto en producción no se registra nada.
- `TRUST_PROXY=1` para leer `X-Forwarded-For` (rate limit y eventos) — activarlo solo detrás de un proxy de confianza.
- `/cuenta` hace una sola petición (`/api/listings/mine/stats`). Días agrupados en hora de República Dominicana.

## Fuera de alcance
- Botón "Agendar visita" (SCHEDULE_CLICK reservado).
- Herramienta externa (Plausible/PostHog), cron de purga, analítica de búsqueda.
- Destacados y pagos (Fase 7).
