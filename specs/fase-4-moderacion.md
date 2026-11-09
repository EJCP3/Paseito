# Fase 4 — Legal, moderación y panel de admin

## Qué
Cumplir los P0/P1 legales (RQ-LEGAL-01/03), reportes de anuncios (RQ-MOD-02) y un panel de admin básico (RQ-ADMIN-01/02/03). Decisiones del usuario (2026-11-09): admin = `euddy.javier@gmail.com`; ubicación pública como círculo de ~300 m; textos legales con marcadores `[NOMBRE LEGAL]` / `[CORREO DE CONTACTO]`, marcados como borrador.

## Cambios

**A1. Migración `fase4_pausa_admin`** (aditiva, se aplica con permiso)
- `Listing.adminPausedAt DateTime?`, `Listing.adminPausedReason String?`.

**A2. Reglas puras** — `server/lib/listingRules.ts`, `server/lib/adminRules.ts` (TDD)
- `canPublish` recibe también `adminPausedAt`: si no es null → `{ ok: false, reason: 'Pausado por moderación…' }`. Aplica a publish y resume.
- `adminListingAction(listing, action: 'pause' | 'unpause' | 'delete')` → cambios a aplicar o error. `pause`: `status: PAUSED`, `adminPausedAt: now`, `adminPausedReason` (obligatorio, 3–300 chars). `unpause`: limpia `adminPausedAt/Reason` y deja `PAUSED` (el dueño decide reanudar). `delete`: `deletedAt: now`. No sobre anuncios ya borrados.
- `canModerateUser(actor, target)`: no a uno mismo, no a otro ADMIN, no a usuarios borrados.
- `ReportInputSchema` (Zod, `shared/schemas/report.schema.ts`): `reason` ∈ `ReportReason`, `details` opcional ≤ 1000, obligatorio si `OTHER`.

**A3. Legal (RQ-LEGAL-01)**
- Páginas `app/pages/terminos.vue` y `app/pages/privacidad.vue`: borrador claro (banner "Borrador — revisar con un abogado"), marcadores `[NOMBRE LEGAL]`, `[CORREO DE CONTACTO]`, `[FECHA]`. Contenido: qué es Paseito, uso, contenido de los anuncios, contacto público del vendedor (RQ-LEGAL-02), ubicación aproximada, datos que se guardan (cuenta, anuncios, eventos sin IP), proveedores (Neon, Cloudinary, Resend, Google, Better Auth/dash), borrado de cuenta, contacto.
- `SignupModal.vue`: checkbox obligatorio "Acepto los Términos y la Política de privacidad" (enlaces) que bloquea crear cuenta con email **y** con Google.
- Servidor: `databaseHooks.user.create.before` pone `termsAcceptedAt: new Date()` (todo registro pasa por el checkbox).
- Enlaces a Términos y Privacidad en un pie mínimo del layout por defecto (texto pequeño; sin rehacer el footer borrado).

**A4. Ubicación aproximada (RQ-LEGAL-03)** — `ListingMap.client.vue`
- Sin `L.marker`. `L.circle` de 300 m centrado en la coordenada pública, zoom 15. El dueño ve lo mismo (no hace falta otra vista).

**A5. Reportes (RQ-MOD-02)**
- `POST /api/listings/:id/report` → solo anuncios ACTIVE no borrados; `reporterId` si hay sesión (opcional); rate limit 5/hora por usuario/IP (en `server/middleware/rate-limit.ts`). 201.
- Botón "Reportar anuncio" en `anuncio/[slug].vue` → modal con motivo (labels de `ReportReason`) y detalles; mensaje de gracias. No visible para el dueño.

**A6. Panel de admin (RQ-ADMIN-01/02/03)** — `app/pages/admin/index.vue` + `app/middleware/admin.ts`
- Middleware de cliente: sin sesión → login; sin `role === 'ADMIN'` → 404. El servidor protege igual con `requireAdmin`.
- Pestañas: **Anuncios** (todos los no borrados, filtro por estado, búsqueda por título, acciones pausar con motivo / quitar pausa / eliminar), **Reportes** (abiertos primero; resolver o descartar; enlace al anuncio; "pausar anuncio" desde el reporte), **Usuarios** (búsqueda por email/nombre; suspender/reactivar), **Auditoría** (últimas 100 acciones).
- Endpoints `server/api/admin/`: `listings.get.ts`, `listings/[id].patch.ts`, `reports.get.ts`, `reports/[id].patch.ts`, `users.get.ts`, `users/[id].patch.ts`, `audit.get.ts`. Todos con `requireAdmin` y paginación (`take` ≤ 50).
- Suspender: `suspended: true`, `suspendedAt`, borra sus sesiones y pausa sus anuncios activos (sin `adminPausedAt`); reactivar: `suspended: false` (anuncios quedan pausados).
- Cada acción escribe `AuditLog` (`actorId`, `action`, `targetType`, `targetId`, `metadata` con motivo) en la misma transacción.
- UI sobria con los estilos existentes; usable a 375px (tablas → tarjetas).

**A7. Dueño ve la moderación** — `/cuenta`
- Anuncio con `adminPausedAt`: etiqueta "Pausado por moderación" + motivo; sin botones Reanudar/Publicar.

**A8. Admin inicial**
- `scripts/make-admin.ts <email>` (idempotente). Se ejecuta para `euddy.javier@gmail.com` con permiso del usuario.

## Criterios de terminado
- [x] Reglas A2 cubiertas ← test
- [x] Registro sin checkbox bloqueado (email y Google); usuario nuevo con `termsAcceptedAt` ← navegador + BD
- [x] `/terminos` y `/privacidad` a 375px y 1440px ← captura
- [x] Mapa del detalle sin pin, con círculo ← captura
- [x] Reportar como anónimo y con sesión; 6.º reporte en una hora → 429 ← navegador
- [x] Admin: pausar con motivo → el dueño no puede reanudar; quitar pausa → el dueño sí; eliminar; resolver reporte; suspender usuario → pierde sesión y no puede entrar; reactivar; todo en Auditoría ← navegador
- [x] No admin: `/admin` → 404 y `/api/admin/*` → 403 ← navegador
- [x] lint, typecheck, test, build en verde
- [x] code-reviewer y security-auditor sin críticos/altos

## Ajustes tras la revisión
- Google: `disableImplicitSignUp` — solo se crean cuentas con Google desde el registro (checkbox marcado, `requestSignUp`); el login con Google no crea cuentas nuevas.
- Registro por email exige `acceptTerms: true` (hook `user.create.before`), también por API directa.
- Pausa admin conserva SOLD/DRAFT, no se repite; eliminar exige motivo; acciones admin, publish y resume con `updateMany` condicionado (sin carreras ni doble auditoría).
- Reportes: un usuario con sesión no duplica un reporte abierto del mismo anuncio. Modales en tema claro; Escape cierra el modal de reporte.

## Fuera de alcance
- Textos legales definitivos (requieren abogado).
- Notificar por correo al dueño cuando se le pausa un anuncio.
- Analítica, destacados y pagos (Fases 6–7).
