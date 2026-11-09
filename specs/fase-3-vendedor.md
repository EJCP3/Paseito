# Fase 3 — Flujo del vendedor, cuenta y roles

## Qué
Que un vendedor pueda publicar, gestionar y borrar sus anuncios y su cuenta de forma completa, y que el servidor sepa quién es admin o está suspendido. Decisiones del usuario (2026-11-08):
- **Moderación**: publicar y revisar después. El anuncio queda `ACTIVE` al publicar y el admin puede pausarlo (panel y reportes en Fase 4).
- **Borrar cuenta**: borrado lógico + anonimización; sus anuncios pasan a `PAUSED`.
- **Borrar anuncio**: borrado lógico (se conservan pagos, denuncias y eventos).

## Cambios

**V1. Migración `fase3_borrado_logico`** (aditiva; se aplica con permiso del usuario)
- `Listing.deletedAt DateTime?` (sin índice propio: siempre se filtra junto a `status`).
- `User.deletedAt DateTime?`.

**V2. Reglas puras** — `server/lib/listingRules.ts` (TDD)
- `canPublish(listing: { status, photosCount, scenesCount, contactConsentAt })` → `{ ok } | { ok: false, reason }`. Requiere al menos 1 foto o 1 escena y consentimiento de contacto. Solo desde `DRAFT` o `PAUSED`.
- `nextOwnerStatus(current, action: 'publish' | 'pause' | 'resume')` → nuevo estado o error. Transiciones del dueño: `DRAFT→ACTIVE` (publish), `ACTIVE→PAUSED` (pause), `PAUSED→ACTIVE` (resume). `PENDING_REVIEW` y `SOLD` no los mueve el dueño. Un anuncio pausado por un admin (Fase 4) no se reanuda aquí: de momento basta con no exponer otra transición.
- `anonymizedUserData(id)` → objeto para `prisma.user.update`: `name: 'Usuario eliminado'`, `email: 'deleted-<id>@paseito.invalid'`, `emailVerified: false`, `phone`, `image` y redes a `null`, `deletedAt: now`.

**V3. Publicar de verdad** — `listing.service.ts`, `server/api/listings/[id]/publish.post.ts`, `[id]/status.post.ts`, `app/pages/publicar/*`
- `createListing` crea en `DRAFT` (antes `ACTIVE`).
- `POST /api/listings/:id/publish` (dueño, email verificado, `contactConsent: true` en el body) → guarda `contactConsentAt` y pasa a `ACTIVE` según `canPublish`/`nextOwnerStatus`. 400 con el motivo si no se cumple.
- `POST /api/listings/:id/status { action: 'pause' | 'resume' }` (dueño).
- `publicar/tour.vue`: el botón "Publicar" llama a `/publish`; encima del botón, checkbox obligatorio "Acepto que mi número de contacto sea visible públicamente" (RQ-LEGAL-02). Si `publish` falla, se muestra el motivo.
- Anuncios ya `ACTIVE` sin `contactConsentAt` siguen activos (no se tocan datos existentes); la exigencia aplica al publicar.

**V4. Gestión en `/cuenta`** — `app/pages/cuenta/index.vue`
- Cada anuncio propio muestra su estado (Borrador / Activo / Pausado) y acciones: **Ver**, **Editar datos** (`/publicar?id=`), **Fotos y tour** (`/publicar/fotos?id=`), **Pausar/Reanudar**, **Publicar** (si es borrador: lleva a `/publicar/tour?id=`), **Eliminar** (con confirmación).
- `publicar/index.vue` con `?id=`: carga el anuncio del dueño, rellena el formulario y guarda con `PATCH` en vez de `POST`; el tipo no se puede cambiar.

**V5. Borrado lógico de anuncios** — `DELETE /api/listings/:id`
- Pone `deletedAt` (no borra la fila ni las imágenes). Todas las lecturas filtran `deletedAt: null`: listado público (`buildListingWhere`), detalle (también para el dueño → 404), `mine`, favoritos, perfil público, conteos de anuncios activos, relacionados.

**V6. Borrar cuenta** — `DELETE /api/users/me` + botón en `/cuenta`
- Confirmación escribiendo "ELIMINAR". En una transacción: anonimiza con `anonymizedUserData`, pasa sus anuncios no borrados a `PAUSED`, borra sus `Session`, `Account` (credenciales) y `Favorite`. Responde 200 y el cliente cierra sesión y vuelve al inicio.
- Un usuario con `deletedAt` no puede iniciar sesión (no tiene `Account`) ni aparecer en perfiles (404).

**V7. Roles y suspensión** — `server/utils/auth.ts`, `server/utils/guards.ts`
- `role`, `suspended` como `additionalFields` con `input: false` (el cliente no puede escribirlos en `signUp`/`updateUser`).
- `requireUser(event)` → sesión o 401; si `suspended` o `deletedAt` → 403. `requireAdmin(event)` → además `role === 'ADMIN'` o 403. Todos los endpoints de escritura existentes pasan a usar `requireUser` (sustituye el bloque repetido de `getSession`).

**V8. Guards de cliente** — `app/middleware/auth.ts`
- Middleware con nombre para `/cuenta` y `/publicar/*`: sin sesión abre el modal de login (mecanismo existente `openLogin(redirect)`) y no renderiza la página vacía.

**V9. Recuperar contraseña (RQ-AUTH-03)** — `LoginModal.vue`
- "¿Olvidaste tu contraseña?" → `authClient.emailOtp.sendVerificationOtp({ email, type: 'forget-password' })` → formulario de código + contraseña nueva → `authClient.emailOtp.resetPassword(...)`. Mismo patrón que `EditProfileModal.vue`. Mensajes de error reales.

**V10. Editor de hotspots** — `TourEditor.client.vue`, `HotspotForm.vue`, `stores/tourEditor.ts`
- Poder borrar un hotspot (botón en el marcador o lista bajo el visor) y editar título/texto/destino. Al borrar una escena, quitar los hotspots LINK que apuntaban a ella (servidor: en `deleteScene`, `deleteMany` de hotspots con ese `targetSceneId`).

**V11. WhatsApp sin teléfono** — `anuncio/[slug].vue`, `ListingDetailsPanel.vue`
- Si no hay número, no se muestra el botón de WhatsApp (en vez de `wa.me/?text=`).

## Criterios de terminado
- [x] `canPublish`, `nextOwnerStatus`, `anonymizedUserData` cubiertos ← test
- [x] `buildListingWhere` filtra `deletedAt: null` ← test
- [x] Crear → DRAFT, no aparece en el listado; publicar sin consentimiento → 400; con consentimiento → ACTIVE y aparece ← navegador con sesión de prueba
- [x] Pausar/Reanudar/Eliminar desde `/cuenta`; eliminado desaparece del listado y su URL da 404 ← navegador
- [x] Editar datos desde `/cuenta` guarda cambios ← navegador
- [x] Borrar cuenta: anonimizada, sin sesión, anuncios pausados, no puede volver a entrar ← navegador
- [x] `/cuenta` y `/publicar` sin sesión piden login ← navegador
- [ ] Recuperar contraseña muestra el paso de código (el envío real depende de `RESEND_API_KEY`) ← **sin probar**: enviaría un correo real
- [x] Hotspot borrado y editado persiste tras recargar ← API (`PUT` + borrar escena limpia LINK); la UI del editor con una panorámica real **sin probar**
- [x] `signUp`/`updateUser` con `role: 'ADMIN'` no cambia el rol ← prueba manual contra la API
- [x] lint, typecheck, test, build en verde; capturas 375px y 1440px de `/cuenta` y `/publicar/tour`
- [x] code-reviewer y security-auditor sin críticos/altos

## Ajustes tras la revisión
- Edición: se pueden vaciar campos opcionales y quitar contactos; el perfil no rellena contactos al editar; el form no se reutiliza entre `?id=` y alta.
- `resume` también pasa por `canPublish`. `requireOwnedListing` en todas las escrituras sobre anuncios (rechaza borrados). Disponibilidad pública solo de anuncios activos.
- Borrar cuenta: limpia `contacts` de sus anuncios y exige sesión de menos de 24 h.
- Auth: `revokeSessionsOnPasswordReset` y bloqueo de sesión para `suspended`/`deletedAt` (fuente única: nuestro `suspended`, no `banned` de dash()).

## Pendiente para Fase 4
- Una pausa del admin hoy la puede deshacer el dueño (`publish`/`resume`): hace falta `pausedBy`/`moderationStatus` antes del panel de admin.
- Rate limit de better-auth persistente (`storage: 'database'`, necesita tabla).

## Fuera de alcance
- Panel de admin, reportes, páginas legales y términos en el registro, ubicación aproximada en el mapa (Fase 4).
- Borrar imágenes de Cloudinary de anuncios borrados (se conservan con el borrado lógico).
- Exportar datos de la cuenta (portabilidad de RQ-AUTH-04): pendiente.
