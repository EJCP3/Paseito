# Fase 0 — Base de calidad y limpieza

## Qué
Que cualquier error de tipos, de lint o de tests se detecte antes de mergear, y quitar el código muerto y los restos de vehículos (RQ-SCOPE-01/02). Sin cambios de comportamiento para el usuario salvo los textos.

## Cambios

**B1. Herramientas** — `package.json`
- `@nuxt/eslint` (módulo en `nuxt.config.ts` + `eslint.config.mjs` que use `withNuxt()`), `eslint`, `typescript`, `vue-tsc`.
- Scripts: `lint` (`eslint .`), `typecheck` (`nuxi typecheck`), `test` ya existe.
- `pnpm lint` y `pnpm typecheck` terminan en 0. Los errores que salgan en el código existente se arreglan de verdad; solo se desactiva una regla si es ruido de estilo y se dice en el PR. Nada de `// @ts-ignore` masivo.

**B2. CI** — `.github/workflows/ci.yml`
- En push y pull_request: Node 22, pnpm (versión de `packageManager` o la del lockfile), `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
- Sin secretos: `prisma generate` corre en `postinstall` y no necesita BD. Si el build pide variables, se pasan valores ficticios no secretos en el workflow.

**B3. Código muerto**
- Borrar `app/pages/producto/[id].vue`, `app/data/products.ts`.
- Borrar componentes y composables sin uso: `app/components/AppNavbar.vue`, `AppFooter.vue`, `listing/ListingFilters.vue`, `listing/ListingGallery.vue`, `app/composables/useListings.ts` (y tipos que queden huérfanos en `shared/types/listing.ts`).
- Borrar el modo mock: `server/utils/mockData.ts`, `useMock()` y todas sus ramas en `listing.service.ts` y `tour.service.ts`.
- Borrar `reorderScenes`, `getScenesByListingId` y `image.service.ts` si queda vacío o sin uso.
- `@types/three` fuera. `three` se queda (peer de Photo Sphere Viewer).

**B4. Vehículos fuera de la V1 (RQ-SCOPE-02)**
- Zod: `ListingTypeSchema` sin `VEHICLE`; quitar `vehicleSchema` de la unión. La API rechaza `type: 'VEHICLE'` (400).
- `UpdateListingSchema`: quitar `brand`, `model`, `year`, `mileageKm`.
- UI: quitar la opción, el paso "Datos del vehículo" y `isVehicle` de `publicar/index.vue`; la rama vehicle de `ListingDetailsPanel.vue`; el filtro de `ProductSession.vue`.
- `shared/types/enums.ts`: se mantiene `VEHICLE` en el enum TS solo si Prisma lo necesita para tipar; si no se usa, fuera también de labels/iconos.
- El enum de Prisma no se toca aquí (va en la migración de Fase 2).
- Textos: `nuxt.config.ts` (title/description), `cuenta/index.vue`, `publicar/fotos.vue`, `README.md` → solo inmuebles. "Cantidad de vehículos" del garaje en `HouseFields.vue` se queda.

**B5. Documentos (RQ-SCOPE-01)**
- `paseito.md` y `paseito-tecnico.md`: nota al inicio "Documento histórico; la fuente de verdad es `Plan.md` + `Requerimientos.md`".
- `README.md`: descripción, comandos (`dev`, `build`, `test`, `lint`, `typecheck`) y estructura actual.

## Criterios de terminado
- [x] `CreateListingSchema` rechaza `type: 'VEHICLE'` y acepta casa/apto/villa válidos ← test
- [x] `pnpm lint` 0 errores ← comando
- [x] `pnpm typecheck` 0 errores ← comando
- [x] `pnpm test` en verde, `pnpm build` sin errores
- [ ] Workflow de CI válido y en verde en el PR ← GitHub
- [x] `grep -ri vehicle app server shared` solo deja lo justificado ← comando
- [x] Home, detalle de anuncio y `/publicar` se ven bien a 375px y 1440px; `/producto/1` da 404 ← captura
- [x] code-reviewer sin bloqueantes

## Fuera de alcance
- Migración de Prisma (enum `ListingType`, columnas de vehículo): Fase 2.
- Arreglar warnings de rendimiento (chunks > 500 kB): Fase 5.
- Reglas de lint estrictas de estilo (Prettier, orden de imports).
