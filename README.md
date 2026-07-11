# Paseito 🏠🚗

Marketplace de inmuebles y vehículos con tours virtuales 360°.

## Stack

- **Nuxt 4** (SSR, Nitro)
- **Tailwind CSS 4** + **DaisyUI 5**
- **GSAP** (ScrollTrigger, Flip)
- **Photo Sphere Viewer** (visor 360°)
- **PostgreSQL** + **Prisma**
- **Better Auth**
- **Zod** + **Pinia**

## Setup

### 1. Variables de entorno

```bash
cp .env.example .env
# Editar .env con tus valores
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Base de datos (cuando tengas PostgreSQL)

```bash
# Generar cliente Prisma
npx prisma generate

# Crear tablas
npx prisma db push

# Ejecutar seed (datos de ejemplo)
npx prisma db seed
```

### 4. Servidor de desarrollo

```bash
pnpm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Estructura del proyecto

```
Paseito/
├── app/                    # Frontend (Vue/Nuxt)
│   ├── pages/              # Rutas: /, /buscar, /listado/[slug], /publicar, /cuenta
│   ├── components/         # Componentes: hero/, tour/, listing/, upload/
│   ├── composables/        # useListings, useTour, useUpload
│   ├── stores/             # Pinia: tourEditor
│   ├── layouts/            # Layout default (navbar + footer)
│   └── assets/css/         # Tailwind 4 + DaisyUI 5 + tema custom
│
├── server/                 # Backend (Nitro)
│   ├── api/                # REST API: listings/, tours/
│   ├── services/           # Lógica de negocio
│   └── utils/              # Prisma singleton
│
├── shared/                 # Código compartido cliente/servidor
│   ├── types/              # TypeScript interfaces + enums
│   └── schemas/            # Zod schemas de validación
│
├── prisma/                 # Esquema de base de datos
├── plugins/                # GSAP client-only plugin
└── public/                 # Assets estáticos
```

## Ajustar animación del Hero

El hero usa GSAP Flip + ScrollTrigger. Para ajustar:

- **Velocidad del scroll**: Modifica `end: "+=100%"` en `BentoGalleryHero.vue` (mayor = más lento)
- **Curva de animación**: Cambia `ease: 'none'` por `'power1.inOut'`, `'power2.out'`, etc.
- **Pin duration**: Ajusta el valor de `end` del ScrollTrigger

## Licencia

Privado — Todos los derechos reservados.
