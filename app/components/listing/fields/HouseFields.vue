<script setup lang="ts">
/**
 * HouseFields — Modalidad (alquiler/venta) + características propias de una casa.
 * Usado por publicar/index.vue cuando type === HOUSE.
 */
import { ListingMode, ListingModeLabels } from '~~/shared/types/enums'

const model = defineModel<{
  mode: string
  floors: number | null
  hasPatio: boolean | null
  patioSize: number | null
  hasPool: boolean | null
  hasGarage: boolean | null
  garageSpots: number | null
  hasCistern: boolean | null
  hasGenerator: boolean | null
  landAreaM2: number | null
}>({ required: true })

const modeOptions = [ListingMode.RENT_LONG_TERM, ListingMode.SALE]
const boolFields = [
  { key: 'hasPool', label: 'Piscina propia' },
  { key: 'hasCistern', label: 'Cisterna/tanque de agua' },
  { key: 'hasGenerator', label: 'Planta eléctrica' },
] as const
</script>

<template>
  <div class="space-y-4">
    <!-- Modalidad -->
    <div>
      <span class="field-label">Modalidad <span class="text-red-500">*</span></span>
      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="opt in modeOptions"
          :key="opt"
          type="button"
          class="pill justify-center"
          :class="{ active: model.mode === opt }"
          @click="model.mode = opt"
        >
          {{ ListingModeLabels[opt] }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <label class="field">
        <span class="field-label">Plantas/niveles</span>
        <input v-model.number="model.floors" type="number" class="field-input" placeholder="2" min="1" />
      </label>
      <label class="field">
        <span class="field-label">Área de terreno (m²)</span>
        <input v-model.number="model.landAreaM2" type="number" class="field-input" placeholder="300" />
      </label>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <label v-for="f in boolFields" :key="f.key" class="flex items-center gap-2 text-sm">
        <input type="checkbox" v-model="model[f.key]" class="w-4 h-4 accent-[var(--color-neon)] cursor-pointer" />
        {{ f.label }}
      </label>
    </div>

    <!-- Patio (con tamaño condicional) -->
    <div class="grid grid-cols-2 gap-4 items-end">
      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" v-model="model.hasPatio" class="w-4 h-4 accent-[var(--color-neon)] cursor-pointer" />
        Patio
      </label>
      <label v-if="model.hasPatio" class="field">
        <span class="field-label">Tamaño aprox. (m²)</span>
        <input v-model.number="model.patioSize" type="number" class="field-input" placeholder="50" />
      </label>
    </div>

    <!-- Garaje (con cantidad condicional) -->
    <div class="grid grid-cols-2 gap-4 items-end">
      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" v-model="model.hasGarage" class="w-4 h-4 accent-[var(--color-neon)] cursor-pointer" />
        Garaje cubierto
      </label>
      <label v-if="model.hasGarage" class="field">
        <span class="field-label">Cantidad de vehículos</span>
        <input v-model.number="model.garageSpots" type="number" class="field-input" placeholder="2" min="1" />
      </label>
    </div>
  </div>
</template>
