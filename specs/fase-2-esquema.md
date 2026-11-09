# Fase 2 — Esquema de datos (una sola migración)

## Qué
Añadir de una vez todo lo que las Fases 3–7 necesitan en la base de datos (Requerimientos.md §15.2), sin cambiar todavía el comportamiento de la app. Migración **solo aditiva**: no borra columnas ni datos.

## Cambios en `prisma/schema.prisma`

**Usuarios (RQ-AUTH-01, RQ-ADMIN-02)**
- `enum Role { USER ADMIN }`; `User.role Role @default(USER)`.
- `User.suspended Boolean @default(false)`.

**Anuncios**
- `ListingStatus` + `PENDING_REVIEW` (RQ-MOD-01; la estrategia de moderación se decide en Fase 3).
- `Listing.contactConsentAt DateTime?` (RQ-LEGAL-02: fecha del consentimiento; null = sin consentimiento).
- `ListingType` **mantiene** `VEHICLE` declarado (RQ-SCOPE-02 lo permite si está deshabilitado en UI y Zod, como ya quedó en Fase 0). Evita migrar/borrar filas existentes. Se actualiza el comentario `ponytail` de `server/lib/listingWhere.ts`.
- Campos de vehículo (`brand`, `model`, `year`, `mileageKm`) se quedan (RQ-SCOPE-02).

**Fotos (RQ-A11Y-03)**
- `Photo.altText String?`.

**Reportes (RQ-MOD-02)**
- `enum ReportReason { SPAM FRAUD INAPPROPRIATE MISLEADING_PRICE OTHER }`, `enum ReportStatus { OPEN RESOLVED DISMISSED }`.
- `model Report { id, listingId (cascade), reporterId String? (User, SetNull), reason, details String?, status @default(OPEN), createdAt, resolvedAt DateTime?, resolvedById String? }` + `@@index([status, createdAt])`, `@@index([listingId])`.

**Auditoría (RQ-ADMIN-03)**
- `model AuditLog { id, actorId (User), action String, targetType String, targetId String, metadata Json?, createdAt }` + `@@index([targetType, targetId])`, `@@index([createdAt])`.

**Analítica (RQ-ANALYTICS-01)**
- `enum ListingEventType { VIEW CONTACT_CLICK SCHEDULE_CLICK TOUR_OPEN TOUR_TIME }`.
- `model ListingEvent { id, listingId (cascade), type, value Int? (segundos para TOUR_TIME), createdAt }` + `@@index([listingId, type, createdAt])`. Sin userId ni IP (privacidad).

**Destacados (RQ-MONETIZE-01)**
- `enum FeaturePlacement { HERO SIDEBAR BADGE }`, `enum FeatureStatus { PENDING ACTIVE CANCELLED }`.
- `model Feature` como en Requerimientos.md §13 (`placement`, `startsAt`, `endsAt`, `priceCents`, `currency`, `paymentRef?`, `createdAt`) + `status FeatureStatus @default(PENDING)` (RQ-MONETIZE-03: pendiente hasta el webhook). `@@index([placement, status, startsAt, endsAt])`. Ids con `uuid()` como el resto del esquema.

**Índices (auditoría de rendimiento)**
- `Photo @@index([listingId, order])`, `Scene @@index([listingId, order])`, `Hotspot @@index([sceneId])`, `Listing @@index([ownerId])`, `Listing @@index([status, createdAt])`, `Favorite @@index([listingId])`.
- Quitar `Listing @@index([slug])` (redundante con `@unique`).

**Código**
- `shared/types/enums.ts` y `shared/schemas/listing.schema.ts`: añadir `PENDING_REVIEW` y los enums nuevos que el front vaya a usar (`Role`, `ReportReason`, `ListingEventType`, `FeaturePlacement`) con sus labels en español. Nada más usa todavía los modelos nuevos.

## Migración
- Generar la SQL **sin tocar la BD**: `prisma migrate diff --from-schema-datamodel <esquema de la rama base> --to-schema-datamodel prisma/schema.prisma --script` → `prisma/migrations/<timestamp>_fase2_moderacion_analitica_destacados/migration.sql`.
- Revisar que solo hay `CREATE TYPE`, `ALTER TYPE ... ADD VALUE`, `ALTER TABLE ... ADD COLUMN` (nullables o con default), `CREATE TABLE`, `CREATE INDEX` y el `DROP INDEX` del slug.
- Aplicar con `prisma migrate deploy` **solo con el visto bueno del usuario**.

## Criterios de terminado
- [x] `prisma validate` ok y `prisma migrate diff` desde la BD tras aplicar → vacío ← comando
- [x] La SQL es solo aditiva (revisión manual + code-reviewer)
- [x] Test: los enums de `shared/` coinciden con los del cliente Prisma generado (`$Enums`) ← test
- [x] `pnpm lint`, `typecheck`, `test`, `build` en verde
- [x] Tras aplicar: home, detalle y `/cuenta` funcionan igual ← navegador
- [x] code-reviewer sin bloqueantes

## Ajustes tras la revisión (2.ª migración `20260801000100_fase2_ajustes_revision`)
- `AuditLog.actorId` nullable con `onDelete: SetNull` (el log sobrevive al borrado del admin).
- `User.suspendedAt`, `User.termsAcceptedAt` (RQ-LEGAL-01), relación `Report.resolvedBy`.
- `Feature.paymentRef @unique` (idempotencia del webhook), `Feature @@index([listingId])`, `ListingEvent @@index([createdAt])`.

## Decisiones pendientes (Fase 3)
- Borrado de cuenta (RQ-AUTH-04): `Listing.owner` no tiene `onDelete` → hoy impide borrar un usuario con anuncios. Elegir cascade o borrado lógico + anonimización.
- `Feature` y `Report` se borran en cascada con el anuncio: decidir si el historial de pagos/denuncias debe sobrevivir (borrado lógico del anuncio o copia al `AuditLog`).
- Deduplicación de `VIEW` en `ListingEvent` (en servidor, sin tocar esquema) al implementar la analítica.

## Fuera de alcance
- Usar los modelos nuevos (endpoints, UI, moderación, admin, eventos, pagos): Fases 3–7.
- Índice de texto completo (pg_trgm): Fase 5.
- Quitar `VEHICLE` del enum.
