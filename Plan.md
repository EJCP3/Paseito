# Paseito (Nuxt + Tailwind + DaisyUI + GSAP)

Quiero que construyas el proyecto completo de un **marketplace de inmuebles y vehículos con tours virtuales 360°**, con el siguiente stack, arquitectura y referencias de diseño. Todo lo que sigue es una única especificación: úsala como fuente de verdad.

---

## 1. Stack técnico

- **Nuxt 4** (full-stack, SSR, Nitro como backend en el mismo proyecto)
- **TailwindCSS** como sistema de utilidades
- **DaisyUI** sobre Tailwind para componentes base (navbar, botones, cards, modals, forms)
- **GSAP** (con plugins **ScrollTrigger** y **Flip**) para las animaciones del hero y transiciones de scroll
- **Photo Sphere Viewer** (`@photo-sphere-viewer/core`, `virtual-tour-plugin`, `markers-plugin`) para el visor 360 en producción — en lugar de Three.js manual
- **PostgreSQL + Prisma** para la base de datos
- **Cloudflare R2** (o S3) para almacenamiento de panorámicas, con subida directa vía URLs firmadas
- **Sharp** en Nitro para validar dimensiones y generar thumbnails/WebP
- **Better Auth** para autenticación
- **Zod** para validación de esquemas compartidos cliente/servidor
- **Pinia** para el estado del editor de tours

---

## 2. Visión general del producto

Un marketplace donde los usuarios publican **apartamentos, casas o vehículos**, suben **fotos panorámicas 360°** de cada ambiente (o del interior del vehículo), y la plataforma genera un **recorrido virtual navegable** con hotspots de navegación (ir a otra escena) e información (tooltips descriptivos). Contacto inicial por WhatsApp (sin chat propio en el MVP).

---

## 3. Referencias de diseño

1. **https://shop.robinhood.com/** — estética general del sitio: minimalista, tipografía grande y bold, mucho espacio en blanco, colores neutros con un acento tipo "neón" (verde lima/verde menta), pills redondeadas, microinteracciones sutiles.
2. **https://demos.gsap.com/demo/scrubbed-bento-gallery/** — mecánica de animación para la sección **hero**: una galería tipo bento grid que, mediante scroll scrubbed, se transforma con GSAP Flip desde un mosaico de 8 imágenes hacia un layout final en columnas a pantalla completa, quedando pineada durante la transición.
3. **Mockup de página de listado (adjunto)** — un mockup HTML ya construido de referencia para la página de detalle de un listado individual, con esta estructura de UI (adaptar a componentes Nuxt/Vue + Tailwind/DaisyUI, reemplazando el render 360 con Photo Sphere Viewer):
   - Marca fija arriba-izquierda (logo + nombre)
   - Panel de información fijo a la izquierda (categoría, título, precio, selector de fecha de visita, CTA principal "Agendar visita" en color neón, CTA secundario "Contactar por WhatsApp")
   - "Guardados" fijo abajo-izquierda
   - Visor 360 centrado en un contenedor con esquinas muy redondeadas, badge "360°", nombre de la escena activa, hint de "Arrastra para recorrer", botón de expandir a pantalla completa
   - Riel de miniaturas de escenas fijo a la derecha (scroll vertical, thumbnail + label, estado activo resaltado)
   - Botón "Detalles ⌄" fijo abajo-centro que despliega un panel con **pills tipo acordeón** (Descripción, Características con grid de specs, Ubicación y vendedor)
   - Modo pantalla completa que oculta la UI secundaria y expande el visor a 100vw/100vh
   - Diseño completamente responsive (colapsa a layout vertical en móvil)
4. **Prototipo de visor 360 con hotspots (adjunto)** — segunda referencia de UI para el visor, con estilo oscuro tipo "cine": barra superior con datos del listado y precio en pill de acento, dock inferior con tabs de escenas (ícono + label), tooltips de hotspots tipo "info" con estética glassmorphism (blur + borde sutil), transición de fade entre escenas, nota "Cómo funciona" colapsable. Usar esta referencia para las **micro-interacciones y el sistema de hotspots** (tipo `goto` para navegar entre escenas, tipo `info` para tooltips descriptivos), no necesariamente su paleta oscura si no calza con la estética Robinhood — mantener la estética clara/neón del punto 1 y 3 como dirección visual principal, pero tomar la lógica de hotspots/dock/tabs de esta segunda referencia.

**Importante:** los dos mockups HTML adjuntos usan Three.js "a mano" con panorámicas generadas por canvas (solo para prototipar). En el proyecto real **no** se debe usar esa técnica de generación procedural ni Three.js directo — se debe migrar toda esa lógica (drag para rotar, zoom con wheel/pellizco, hotspots como sprites, cambio de escena con fade) a **Photo Sphere Viewer** con imágenes panorámicas reales subidas por el usuario, manteniendo el mismo _look & feel_ y las mismas interacciones descritas arriba.

---

## 4. Sección Hero (bento gallery con GSAP Flip)

Implementar como componente `components/BentoGalleryHero.vue`:

- Grid de 8 imágenes en layout "bento" (grid-template-columns/rows con grid-area por ítem, ver estructura del demo de GSAP referenciado en el punto 3.2) que al hacer scroll se transforma, usando `Flip.getState` + `Flip.to` dentro de un `gsap.context`, hacia un layout final en columnas a pantalla completa.
- `ScrollTrigger` con `pin` del contenedor padre, `scrub: true`, `start: "center center"`, `end: "+=100%"`.
- Registrar GSAP/ScrollTrigger/Flip **solo en cliente** (`onMounted`, o plugin de Nuxt con `mode: 'client'`), con `revert()`/`kill()` al desmontar y recreación en `resize`.
- Imágenes optimizadas con `nuxt/image`; dejar placeholders claros para que el usuario cargue sus propias fotos (o usar fotos de ejemplo de listados destacados).
- Responsive: colapsar a una sola columna o reducir cantidad de ítems visibles en pantallas chicas.

Después del hero, secciones de contenido (buscador, categorías destacadas, cómo funciona) con componentes DaisyUI y animaciones de entrada (fade-in/slide-in) con GSAP + ScrollTrigger, manteniendo la estética Robinhood.

---

## 5. Estructura de carpetas del proyecto

```
Paseito/
├── nuxt.config.ts
├── prisma/
│   └── schema.prisma
│
├── shared/
│   ├── types/
│   │   ├── listing.ts
│   │   └── enums.ts
│   └── schemas/
│       ├── listing.schema.ts
│       └── tour.schema.ts
│
├── server/
│   ├── api/
│   │   ├── auth/
│   │   ├── listings/
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   ├── [id].get.ts
│   │   │   ├── [id].patch.ts
│   │   │   └── [id].delete.ts
│   │   ├── tours/
│   │   │   ├── upload-url.post.ts
│   │   │   ├── scenes.post.ts
│   │   │   └── hotspots.put.ts
│   │   └── messages/
│   ├── services/
│   │   ├── listing.service.ts
│   │   ├── tour.service.ts
│   │   ├── image.service.ts
│   │   └── storage.service.ts
│   ├── middleware/
│   │   └── auth.ts
│   └── utils/
│       └── db.ts
│
├── app/
│   ├── pages/
│   │   ├── index.vue
│   │   ├── buscar.vue
│   │   ├── listado/[slug].vue
│   │   ├── publicar/
│   │   │   ├── index.vue
│   │   │   ├── fotos.vue
│   │   │   └── tour.vue
│   │   └── cuenta/
│   ├── components/
│   │   ├── hero/
│   │   │   └── BentoGalleryHero.vue
│   │   ├── tour/
│   │   │   ├── TourViewer.client.vue
│   │   │   ├── TourEditor.client.vue
│   │   │   ├── SceneTabs.vue
│   │   │   └── HotspotForm.vue
│   │   ├── listing/
│   │   │   ├── ListingCard.vue
│   │   │   ├── ListingGallery.vue
│   │   │   ├── ListingDetailsPanel.vue   (pills acordeón: Descripción / Características / Ubicación)
│   │   │   └── ListingFilters.vue
│   │   └── upload/
│   │       ├── PanoramaUploader.vue
│   │       └── PhotoUploader.vue
│   ├── composables/
│   │   ├── useTour.ts
│   │   ├── useUpload.ts
│   │   └── useListings.ts
│   └── stores/
│       └── tourEditor.ts
│
└── workers/                  # fase 2
    └── image-processor/
```

Regla de oro: `server/api/` solo valida entrada (Zod) y llama a `server/services/`. La lógica de negocio vive en los services para poder extraerla a un worker aparte sin tocar el resto.

---

## 6. Esquema de base de datos (Prisma)

```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String
  phone     String?
  listings  Listing[]
  createdAt DateTime  @default(now())
}

model Listing {
  id          String        @id @default(cuid())
  slug        String        @unique
  type        ListingType   // APARTMENT | HOUSE | VEHICLE
  title       String
  description String
  price       Decimal
  currency    String        @default("USD")
  status      ListingStatus @default(DRAFT) // DRAFT | ACTIVE | SOLD | PAUSED

  areaM2      Float?
  bedrooms    Int?
  bathrooms   Int?
  parking     Int?
  sector      String?
  city        String?

  brand       String?
  model       String?
  year        Int?
  mileageKm   Int?

  owner       User          @relation(fields: [ownerId], references: [id])
  ownerId     String
  photos      Photo[]
  scenes      Scene[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([type, status, city, sector])
  @@index([price])
}

model Photo {
  id        String  @id @default(cuid())
  url       String
  thumbUrl  String
  order     Int
  listing   Listing @relation(fields: [listingId], references: [id], onDelete: Cascade)
  listingId String
}

model Scene {
  id          String    @id @default(cuid())
  name        String
  panoramaUrl String
  previewUrl  String
  order       Int
  initialYaw  Float     @default(0)
  listing     Listing   @relation(fields: [listingId], references: [id], onDelete: Cascade)
  listingId   String
  hotspots    Hotspot[]
}

model Hotspot {
  id            String      @id @default(cuid())
  type          HotspotType // LINK | INFO
  yaw           Float
  pitch         Float
  title         String?
  text          String?
  targetSceneId String?
  scene         Scene       @relation(fields: [sceneId], references: [id], onDelete: Cascade)
  sceneId       String
}
```

Fase 2: `Conversation`/`Message` (chat), `Favorite`, `Report`.

---

## 7. Flujo de subida de panorámica → tour publicado

```
Usuario → valida proporción ~2:1 en el navegador → POST /api/tours/upload-url
       → Nitro genera URL firmada de R2 → PUT directo del navegador a R2
       → POST /api/tours/scenes → Sharp verifica dimensiones reales,
         genera preview WebP, crea Scene en la BD
       → editor de tour: clic en la esfera = hotspot (yaw/pitch)
       → PUT /api/tours/hotspots → publica el listado (status = ACTIVE)
```

Puntos clave:

- La subida va **directo del navegador a R2** con URL firmada; el servidor nunca recibe los 20-40 MB del archivo.
- Doble validación de proporción 2:1: rápida en cliente, definitiva en servidor con Sharp.
- Un hotspot es `{ yaw, pitch, type, target }`. El editor y el visor público comparten el mismo componente base; el editor solo añade el listener de clic sobre la esfera para capturar la posición.

---

## 8. Componentes clave del visor (con Photo Sphere Viewer)

`TourViewer.client.vue` (visor público, montado con `<ClientOnly>` porque WebGL no existe en SSR):

```vue
<script setup lang="ts">
import { Viewer } from "@photo-sphere-viewer/core";
import { VirtualTourPlugin } from "@photo-sphere-viewer/virtual-tour-plugin";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";

const props = defineProps<{ scenes: SceneWithHotspots[] }>();
const container = ref<HTMLElement>();

onMounted(() => {
  new Viewer({
    container: container.value!,
    plugins: [
      [
        VirtualTourPlugin,
        {
          nodes: props.scenes.map((s) => ({
            id: s.id,
            panorama: s.panoramaUrl,
            links: s.hotspots
              .filter((h) => h.type === "LINK")
              .map((h) => ({
                nodeId: h.targetSceneId,
                position: { yaw: h.yaw, pitch: h.pitch },
              })),
          })),
        },
      ],
      [MarkersPlugin, {}],
    ],
  });
});
</script>
<template>
  <div ref="container" class="h-[70vh] w-full rounded-2xl overflow-hidden" />
</template>
```

Uso en la página de listado:

```vue
<ClientOnly>
  <TourViewer :scenes="listing.scenes" />
  <template #fallback>
    <img :src="listing.scenes[0]?.previewUrl" class="h-[70vh] w-full object-cover" />
  </template>
</ClientOnly>
```

`TourEditor.client.vue`: mismo visor en modo edición — escucha el clic del viewer, obtiene `{ yaw, pitch }`, abre `HotspotForm.vue` (¿enlace a otra escena o punto de información?) y hace `PUT /api/tours/hotspots`.

Sobre esta base funcional, construir la UI visual descrita en el punto 3.3 y 3.4 (panel de info fijo, riel de miniaturas, pills de detalles, dock de tabs, tooltips glass, modo pantalla completa) usando Tailwind + DaisyUI, reemplazando el canvas/Three.js manual de los mockups por overlays de Vue sobre Photo Sphere Viewer.

---

## 9. Requerimientos generales de implementación

1. Toda inicialización de GSAP y Photo Sphere Viewer debe ocurrir solo en cliente (evitar errores de SSR con `window`/`document`).
2. Limpieza correcta de ScrollTrigger/Flip/Viewer al desmontar componentes (evitar memory leaks en el SPA).
3. Código componentizado y comentado en las partes clave (inicialización GSAP/Flip, inicialización del visor 360, flujo de subida a R2).
4. Diseño 100% responsive (mobile-first) para hero, página de listado y visor 360.
5. Configurar Tailwind + DaisyUI correctamente en `nuxt.config.ts` y `tailwind.config.js`.
6. Slugs legibles + SSR en las páginas de listado para SEO.

---

## 10. Roadmap

**Fase 1 — MVP:** auth, publicar listado con fotos + panorámicas, editor de hotspots, visor 360 en la página pública con la UI descrita, hero bento gallery animado, búsqueda con filtros, contacto por WhatsApp.

**Fase 2:** chat interno, favoritos, spin 360 exterior para vehículos (secuencia de fotos), worker de imágenes con cola (BullMQ) si el volumen lo pide, planes de pago para destacar listados.

**Fase 3 (exploratorio):** captura asistida desde la app móvil, generación de plano 2D, integración con Luma/Polycam para escaneos 3D reales.

---

## 11. Entregable esperado

- Proyecto Nuxt funcional y ejecutable con `pnpm run dev`.
- Estructura de carpetas tal como se describe en el punto 5.
- Esquema Prisma migrable.
- Componentes de hero, listado y visor 360 funcionando de punta a punta con datos de ejemplo (seed).
- README explicando cómo configurar las variables de entorno (DB, R2), cómo correr las migraciones, y cómo ajustar tiempos/curvas de la animación del hero.
