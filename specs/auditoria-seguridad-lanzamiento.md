# Auditoría de seguridad previa al lanzamiento — Paseito

**Fecha:** 2026-11-09 · **Rama auditada:** `feat/fase-7-destacados` (incluye fases 0–7)
**Método:** dos auditores en paralelo (wisscode `security-auditor`: autenticación/autorización/admin/pagos, y entradas/subidas/XSS/SSRF/cabeceras/DoS), más `pnpm audit`. Solo lectura; sin acceso a `.env`.

## Resumen

| Área | Crítico | Alto | Medio | Bajo |
|---|:---:|:---:|:---:|:---:|
| Dependencias (`pnpm audit --prod`) | 6* | 48* | 30 | 11 |
| Auth, permisos, admin, pagos | 0 | 0 | 4 | 5 |
| Entradas, subidas, XSS, cabeceras, DoS | 0 | 2 | 6 + CSP | 8 |

\* Muchos vienen de herramientas de desarrollo (devtools, CLI, vite-builder, vitest) que no se despliegan. Los que sí afectan al servidor en producción están abajo.

**Lo que está bien:** los 49 endpoints tienen control de acceso en servidor (tabla al final); la propiedad se comprueba en servidor; el rol se lee de la BD en cada petición; `role`/`suspended`/`deletedAt` no son escribibles por el cliente; no hay XSS explotable (markers, popups, JSON-LD y sitemap escapan); `isListingAssetUrl` es estricto; Zod descarta claves desconocidas (sin mass assignment); coordenadas públicas redondeadas; transiciones de estado con `updateMany` condicionado y lock del Hero; cuentas suspendidas/borradas no pueden crear sesión.

## Estado de las correcciones (rama `fix/seguridad-lanzamiento`)
- ✅ Dependencias: better-auth 1.7.18 (`@better-auth/infra` eliminado), nuxt 4.6.4, vue 3.5.45, sharp 0.35.5, zod 4.6.7, devtools 3.4.4. `pnpm audit --prod`: **0 críticos**; 13 altos restantes son de herramientas de build/dev (nanoid, postcss, source-map-js, deepmerge-ts, tar, node-forge) o de `mysql2` (driver no usado).
- ✅ Moneda en enum · límite de cuerpo (413/411) · teléfono fuera de la API pública · IP por `IP_HEADER` (sin `X-Forwarded-For`) · `dash()` quitado · nombre escapado en correos · CSP Report-Only + HSTS + COOP en producción · analítica exige `Origin`/`Sec-Fetch-Site` y sal propia · Zod y topes en fotos (30) y escenas (20) · uploads 20/10 min · búsqueda GET 60/min · `.parse()` → 400 · panorámica ≤ 8192×4096 · sitemap en caché · script de datos de prueba bloqueado en producción · `.env.example`.
- ⏳ Pendiente: `rateLimit.storage: 'database'` si hay varias instancias; índice `pg_trgm`; límite de cuerpo en el proxy; reportes anónimos con dedupe; URLs de redes https; avatar solo Google/Cloudinary; borrar cuenta con OTP; allowlist exacta de Maps; topes de colas/cachés de Nominatim/Overpass; pasar la CSP a obligatoria tras revisar violaciones; actualizar Node a ≥ 22.21 (Nuxt 4.6 lo pide).

## Bloqueantes de lanzamiento (hallazgos originales)

### Dependencias (afectan a producción)
| Paquete | Versión | Arreglo | Riesgo |
|---|---|---|---|
| `better-auth` | 1.6.23 | **≥ 1.7.7** | **Crítico:** el `state` de OAuth se puede usar como magic link para iniciar sesión; OAuth proxy permite entrar como otro usuario. Usamos Google. |
| `nuxt` | 4.4.8 | **≥ 4.5.1** | Caída por memoria sin autenticar; `routeRules` (nuestras cabeceras) se saltan con rutas en mayúsculas; la caché del payload puede servir datos SSR de otro usuario. |
| `@vue/server-renderer` (vue) | 3.5.39 | **≥ 3.5.42** | XSS en nombres de atributo durante SSR. |
| `sharp` | 0.35.3 | **≥ 0.35.5** | Vulnerabilidades en libheif/librsvg; leemos metadatos de cada imagen subida. |
| `zod` | 4.4.3 | **≥ 4.6.6** | Agotamiento de memoria con entradas enormes. |
| `devalue`, `seroval` | vía nuxt | se arreglan con nuxt | Serialización del payload. |
| `@nuxt/devtools` | vía nuxt | ≥ 3.3.1 | **Crítico solo en desarrollo:** RPC sin autenticar permite ejecutar comandos en la máquina que corre `pnpm dev`. |

### Código
1. **Moneda libre tumba páginas públicas (ALTO)** — `shared/schemas/listing.schema.ts:43,139`: `currency` acepta cualquier texto; `Intl.NumberFormat` lanza y portada/`/buscar`/detalle dan 500. → `z.enum(['USD','DOP','EUR'])`. (BD actual: solo USD y DOP, sin saneo necesario.)
2. **Sin límite de tamaño de cuerpo (ALTO)** — `readBody` carga todo en memoria; un POST anónimo de varios GB a `/api/listings/x/events` provoca OOM. → middleware 413 si `content-length` > 1 MB (salvo `/api/uploads`) + límite en el proxy.
3. **Teléfono del vendedor público (MEDIO, legal)** — `listing.service.ts:101,130` devuelve `owner.phone` aunque el vendedor no haya elegido WhatsApp. → quitarlo del `select`; usar solo `contacts`. (Lo señalaron los dos auditores.)
4. **IP del cliente falsificable / rate limit en memoria (MEDIO)** — con `TRUST_PROXY=1` se toma la IP más a la izquierda de `X-Forwarded-For` (la controla el cliente); Better Auth no tiene `advanced.ipAddress`; los límites viven en memoria. → leer la cabecera que fija la plataforma (`x-vercel-forwarded-for`, `cf-connecting-ip` o `x-real-ip`) en `clientIp` y en Better Auth; con varias instancias, `rateLimit: { storage: 'database' }`.
5. **Plugin `dash()` de `@better-auth/infra` (MEDIO, decisión)** — monta `/dash/*` (ejecutar operaciones en BD, cambiar rol, suplantar, exportar usuarios), protegido por un JWT de la nube de Better Auth + `BETTER_AUTH_API_KEY`; envía huellas del navegador y eventos de login a un tercero; su "ban" no es nuestro `suspended`. → quitarlo si no se usa el dashboard; si se usa, API key + 2FA y declararlo en privacidad.
6. **HTML inyectable en el correo de verificación (MEDIO)** — `server/utils/emailTemplates.ts:70` (`Hola ${name}` sin escapar) → phishing desde nuestro dominio. → `escapeHtml(name)` y `name` ≤ 80.
7. **Sin CSP (MEDIO)** — propuesta lista abajo; desplegar primero como `Report-Only`.

## Medios y bajos (después del lanzamiento o junto a él)
- **Analítica falsificable** — `events.post.ts:17-25` deja pasar peticiones sin `Origin` ni `Sec-Fetch-Site` (curl). → exigir una de las dos.
- **Abuso de Cloudinary** — sin tope de fotos/escenas por anuncio; `photos.post.ts` sin Zod (`order` string → 500); 60 subidas/10 min. → Zod, máx. 30 fotos / 20 escenas, 20 subidas/10 min, "Strict transformations" en Cloudinary.
- **Búsqueda costosa sin límite** — `contains` sobre `description` sin índice, GET sin rate limit. → regla 60/min para `GET /api/listings`, índice `pg_trgm`, `sitemap.xml` en caché.
- **Spam anónimo de reportes** (dedupe solo con sesión) · **URLs de redes sin validar** en `update-user` (exigir https) · **avatar externo** arbitrario (permitir solo Google/Cloudinary) · **sin comprobación de Origin** en escrituras propias (defensa en profundidad) · **sal de analítica = secreto de sesión** (usar `ANALYTICS_SALT`) · **borrar cuenta** solo exige sesión < 24 h (pedir OTP/contraseña; cancelar destacados pendientes) · `.parse()` → 500 en `geocode*`, `nearby-places*`, `favorites/toggle` · `UpdateListingSchema` valida menos que el de creación · allowlist de Maps `endsWith('.google.com')` · cola de Nominatim y caché de lugares sin tope · panorámicas hasta 16384 px (tope 8192×4096) · **`scripts/set-verification-test-data.ts` modifica usuarios reales**: borrar o proteger con `NODE_ENV`.

## Configuración de producción obligatoria
- `BETTER_AUTH_SECRET` ≥ 32 bytes aleatorios, distinto del de desarrollo.
- `APP_URL` = origen https exacto (si falta, OAuth, Origin y enlaces de correo apuntan a localhost).
- IP real: proxy que **sobrescriba** `X-Forwarded-For`, o cabecera de la plataforma (punto 4). `TRUST_PROXY` sin definir si no hay proxy.
- Google OAuth de producción: redirect `https://<dominio>/api/auth/callback/google`, origen = `APP_URL`.
- `RESEND_API_KEY` + remitente con dominio verificado (SPF/DKIM); sin ellos no llegan verificación ni recuperación de contraseña.
- `DATABASE_URL` con `sslmode=require` y usuario de mínimo privilegio (sin DDL en runtime).
- `CLOUD_*` solo en servidor; activar "Strict transformations" en Cloudinary.
- `NODE_ENV=production`.
- Límite de cuerpo en el proxy: 41 MB en `/api/uploads`, 1 MB en el resto.
- Revisar la lista de ADMIN antes de lanzar (hoy: `euddy.javier@gmail.com` y la cuenta de prueba `prueba-ba547b@example.com`, que hay que quitar).

## CSP propuesta (producción, `routeRules['/**'].headers`)
```ts
...(process.env.NODE_ENV === 'production' && {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy-Report-Only': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://res.cloudinary.com https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://lh3.googleusercontent.com",
    "font-src 'self' data:",
    "connect-src 'self' https://res.cloudinary.com",   // + kv/dash.better-auth.com solo si se conserva dash()
    "worker-src 'self' blob:",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    'upgrade-insecure-requests',
  ].join('; '),
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
}),
```
Tras unos días sin violaciones en consola, renombrar a `Content-Security-Policy`. Más adelante: `nuxt-security` con nonces para quitar `'unsafe-inline'`.

## Tabla de endpoints
`U` = `requireUser`, `A` = `requireAdmin`, `O` = propiedad en servidor, `Opc` = sesión opcional.

| Método y ruta | Auth | Propiedad / rol | Rate limit |
|---|---|---|---|
| ALL /api/auth/** | Better Auth | interno | integrado (en memoria) |
| GET admin/audit, features, listings, reports, users | A | ADMIN | – |
| PATCH admin/features/:id, listings/:id, reports/:id | A | ADMIN + AuditLog | – |
| PATCH admin/users/:id | A | no a sí mismo ni a otro ADMIN | – |
| GET features/hero-availability, hero-listings | público | – | caché 60 s |
| POST features | U | O + ACTIVE, máx. 5 pendientes | 10/h |
| DELETE features/:id · GET features/mine | U | O | – |
| GET listings, listings/:id | público / Opc | no-ACTIVE solo dueño | – |
| POST listings | U + email verificado | – | 10/h |
| PATCH/DELETE listings/:id | U | O | – |
| GET listings/mine, mine/stats | U | dueño | – |
| GET listings/:id/stats | U | O o ADMIN | – |
| POST listings/:id/publish, status | U | O, sin pausa de moderación | – |
| GET/PUT/DELETE listings/:id/availability… | Opc / U | O en escritura | – |
| POST listings/:id/photos | U | O + URL propia | – |
| POST listings/:id/nearby-places, nearby-places-preview | U | O | 10/min |
| POST listings/:id/events | público | – | 120/10 min |
| POST listings/:id/report | Opc | – | 5/h |
| PATCH/DELETE photos/:id | U | O | – |
| POST tours/scenes · PATCH/DELETE tours/scenes/:id · PUT tours/hotspots | U | O | 30/10 min (POST) |
| POST uploads | U | O | 60/10 min |
| POST geocode, geocode-maps-link | U | – | 20/min |
| GET/POST favorites | U | propio | – |
| GET users/:id/profile | público | campos públicos | – |
| DELETE users/me | U + sesión < 24 h | uno mismo | – |
| /dash/** (plugin) | JWT infra + API key | control total | – |
