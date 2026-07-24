# Paseito 🏠🚗

Marketplace de inmuebles y vehículos con tours virtuales 360°.


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
