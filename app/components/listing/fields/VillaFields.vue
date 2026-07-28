<script setup lang="ts">
/**
 * VillaFields — Características de una villa (siempre alquiler por día:
 * sin selector de modalidad). Usado por publicar/index.vue cuando type === VILLA.
 */
import { VILLA_SERVICES } from '~~/shared/types/enums'

const model = defineModel<{
  villaPoolType: string
  villaPoolSize: number | null
  guestCapacity: number | null
  bedsCount: number | null
  villaServices: string[]
  pricePerDay: number | null
  pricePerWeek: number | null
  minNights: number | null
  securityDeposit: number | null
  cancellationPolicy: string
  checkInTime: string
  checkOutTime: string
}>({ required: true })

function toggleService(service: string) {
  const idx = model.value.villaServices.indexOf(service)
  if (idx === -1) model.value.villaServices.push(service)
  else model.value.villaServices.splice(idx, 1)
}

const cancellationOptions = [
  { value: 'flexible', label: 'Flexible' },
  { value: 'moderada', label: 'Moderada' },
  { value: 'estricta', label: 'Estricta' },
]
</script>

<template>
  <div class="space-y-4">
    <!-- Precio por día / semana -->
    <div class="grid grid-cols-2 gap-4">
      <label class="field">
        <span class="field-label">Precio por día <span class="text-red-500">*</span></span>
        <input v-model.number="model.pricePerDay" type="number" class="field-input" placeholder="150" required min="1" />
      </label>
      <label class="field">
        <span class="field-label">Precio por semana (opcional)</span>
        <input v-model.number="model.pricePerWeek" type="number" class="field-input" placeholder="900" min="1" />
      </label>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <label class="field">
        <span class="field-label">Capacidad de huéspedes</span>
        <input v-model.number="model.guestCapacity" type="number" class="field-input" placeholder="8" min="1" />
      </label>
      <label class="field">
        <span class="field-label">Número de camas</span>
        <input v-model.number="model.bedsCount" type="number" class="field-input" placeholder="4" min="1" />
      </label>
      <label class="field">
        <span class="field-label">Mínimo de noches</span>
        <input v-model.number="model.minNights" type="number" class="field-input" placeholder="2" min="1" />
      </label>
      <label class="field">
        <span class="field-label">Depósito de seguridad</span>
        <input v-model.number="model.securityDeposit" type="number" class="field-input" placeholder="200" min="0" />
      </label>
    </div>

    <!-- Piscina -->
    <div>
      <span class="field-label">Piscina</span>
      <div class="grid grid-cols-2 gap-4">
        <div class="flex gap-2">
          <button
            v-for="opt in ['privada', 'compartida']"
            :key="opt"
            type="button"
            class="pill justify-center flex-1"
            :class="{ active: model.villaPoolType === opt }"
            @click="model.villaPoolType = opt"
          >
            {{ opt === 'privada' ? 'Privada' : 'Compartida' }}
          </button>
        </div>
        <input v-model.number="model.villaPoolSize" type="number" class="field-input" placeholder="Tamaño (m²)" />
      </div>
    </div>

    <!-- Servicios incluidos -->
    <div>
      <span class="field-label">Servicios incluidos</span>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="service in VILLA_SERVICES"
          :key="service"
          type="button"
          class="pill"
          :class="{ active: model.villaServices.includes(service) }"
          @click="toggleService(service)"
        >
          {{ service }}
        </button>
      </div>
    </div>

    <!-- Política de cancelación -->
    <div>
      <span class="field-label">Política de cancelación</span>
      <div class="grid grid-cols-3 gap-3">
        <button
          v-for="opt in cancellationOptions"
          :key="opt.value"
          type="button"
          class="pill justify-center"
          :class="{ active: model.cancellationPolicy === opt.value }"
          @click="model.cancellationPolicy = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Check-in / check-out -->
    <div class="grid grid-cols-2 gap-4">
      <label class="field">
        <span class="field-label">Check-in</span>
        <input v-model="model.checkInTime" type="time" class="field-input" />
      </label>
      <label class="field">
        <span class="field-label">Check-out</span>
        <input v-model="model.checkOutTime" type="time" class="field-input" />
      </label>
    </div>
  </div>
</template>
