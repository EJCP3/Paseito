<script setup lang="ts">
/**
 * ApartmentFields — Modalidad (alquiler/venta) + características propias
 * de un apartamento. Usado por publicar/index.vue cuando type === APARTMENT.
 */
import { ListingMode, ListingModeLabels } from '~~/shared/types/enums'

const model = defineModel<{
  mode: string
  floorNumber: number | null
  totalFloors: number | null
  hasElevator: boolean | null
  water24h: boolean | null
  power24h: boolean | null
  hasBalcony: boolean | null
  maintenanceFee: number | null
}>({ required: true })

const modeOptions = [ListingMode.RENT_LONG_TERM, ListingMode.SALE]
const boolFields = [
  { key: 'hasElevator', label: 'Ascensor' },
  { key: 'water24h', label: 'Agua 24h' },
  { key: 'power24h', label: 'Luz 24h / planta eléctrica' },
  { key: 'hasBalcony', label: 'Balcón o terraza' },
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
        <span class="field-label">Piso/planta</span>
        <input v-model.number="model.floorNumber" type="number" class="field-input" placeholder="5" />
      </label>
      <label class="field">
        <span class="field-label">Total de pisos del edificio</span>
        <input v-model.number="model.totalFloors" type="number" class="field-input" placeholder="12" min="1" />
      </label>
      <label class="field">
        <span class="field-label">Mantenimiento/condominio (mensual)</span>
        <input v-model.number="model.maintenanceFee" type="number" class="field-input" placeholder="3500" min="0" />
      </label>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <label v-for="f in boolFields" :key="f.key" class="flex items-center gap-2 text-sm">
        <input type="checkbox" v-model="model[f.key]" class="w-4 h-4 accent-[var(--color-neon)] cursor-pointer" />
        {{ f.label }}
      </label>
    </div>
  </div>
</template>
