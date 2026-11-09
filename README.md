# Paseito

Marketplace de inmuebles (apartamentos, casas y villas) con tours virtuales 360°.
Stack: Nuxt 4, Vue 3, Prisma + PostgreSQL, Better Auth, Tailwind 4 + daisyUI, Photo Sphere Viewer.

## Comandos

```bash
pnpm install       # instala dependencias (postinstall: prisma generate + nuxt prepare)
pnpm dev           # servidor de desarrollo
pnpm build         # build de producción
pnpm test          # tests (Vitest)
pnpm lint          # ESLint
pnpm typecheck     # nuxi typecheck (vue-tsc)
```

CI (`.github/workflows/ci.yml`) corre lint, typecheck, test y build en cada push y pull request.

## Estructura

- `app/` — frontend: `pages/`, `components/`, `composables/`, `stores/`, `plugins/`, `layouts/`
- `server/` — API Nitro: `api/` (rutas), `services/` (lógica), `lib/` (utilidades puras), `utils/`, `middleware/`
- `shared/` — schemas Zod, tipos, enums y datos compartidos entre app y server
- `prisma/` — esquema y migraciones
- `tests/` — tests de Vitest
- `specs/` — specs de cada fase; `Plan.md` + `Requerimientos.md` son la fuente de verdad

## Ajustar animación del Hero

El hero usa GSAP Flip + ScrollTrigger. Para ajustar:

- **Velocidad del scroll**: Modifica `end: "+=100%"` en `BentoGalleryHero.vue` (mayor = más lento)
- **Curva de animación**: Cambia `ease: 'none'` por `'power1.inOut'`, `'power2.out'`, etc.
- **Pin duration**: Ajusta el valor de `end` del ScrollTrigger

## Disponibilidad de villas (v-calendar)

El calendario de disponibilidad de las villas (`AvailabilityEditor.client.vue` /
`AvailabilityCalendar.client.vue`) usa [v-calendar](https://vcalendar.io/), registrado
como plugin cliente-only en `app/plugins/vcalendar.client.ts` (mismo patrón que GSAP/Leaflet).

Después de bajar cambios de este feature:

```bash
pnpm install                       # instala v-calendar si no estaba
pnpm exec prisma migrate dev       # aplica la migración de Listing/AvailabilityRange
pnpm exec prisma generate          # regenera el cliente (detén `pnpm dev` antes: en
                                    # Windows el motor de Prisma queda bloqueado por el
                                    # dev server y `generate` falla con EPERM)
```

## Licencia

Privado — Todos los derechos reservados.

## Créditos

- Datos de ubicaciones de República Dominicana basados en
  [codigos-postales-rd](https://github.com/gareladev/codigos-postales-rd) (INPOSDOM), MIT License.
  Se regeneran con `node --experimental-strip-types scripts/generate-locations.ts`.
