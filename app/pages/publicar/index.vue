<script setup lang="ts">
/**
 * Página de publicación — Formulario de datos del listado
 */
import { ListingType, ListingTypeLabels, ListingTypeIcons } from '~~/shared/types/enums'

useHead({
  title: 'Publicar — Paseito',
})

const router = useRouter()

const form = reactive({
  type: '' as string,
  title: '',
  description: '',
  price: null as number | null,
  currency: 'USD',
  // Inmueble
  areaM2: null as number | null,
  bedrooms: null as number | null,
  bathrooms: null as number | null,
  parking: null as number | null,
  sector: '',
  city: '',
  // Vehículo
  brand: '',
  model: '',
  year: null as number | null,
  mileageKm: null as number | null,
})

const isSubmitting = ref(false)
const error = ref<string | null>(null)

const isRealEstate = computed(() => form.type === ListingType.APARTMENT || form.type === ListingType.HOUSE)
const isVehicle = computed(() => form.type === ListingType.VEHICLE)

async function handleSubmit() {
  isSubmitting.value = true
  error.value = null

  try {
    const body: Record<string, any> = {
      type: form.type,
      title: form.title,
      description: form.description,
      price: form.price,
      currency: form.currency,
    }

    if (isRealEstate.value) {
      if (form.areaM2) body.areaM2 = form.areaM2
      if (form.bedrooms !== null) body.bedrooms = form.bedrooms
      if (form.bathrooms !== null) body.bathrooms = form.bathrooms
      if (form.parking !== null) body.parking = form.parking
      if (form.sector) body.sector = form.sector
      if (form.city) body.city = form.city
    }

    if (isVehicle.value) {
      if (form.brand) body.brand = form.brand
      if (form.model) body.model = form.model
      if (form.year) body.year = form.year
      if (form.mileageKm !== null) body.mileageKm = form.mileageKm
    }

    const listing = await $fetch('/api/listings', { method: 'POST', body })

    // Redirigir al paso de fotos
    router.push(`/publicar/fotos?id=${(listing as any).id}`)
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Error al crear el listado'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 md:py-12">
    <!-- Progress -->
    <div class="flex items-center gap-2 mb-8">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style="background: var(--color-neon); color: #0D0D0D;">1</div>
        <span class="text-sm font-semibold">Datos</span>
      </div>
      <div class="flex-1 h-px" style="background: var(--color-border);"></div>
      <div class="flex items-center gap-2 opacity-40">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border" style="border-color: var(--color-border);">2</div>
        <span class="text-sm">Fotos</span>
      </div>
      <div class="flex-1 h-px" style="background: var(--color-border);"></div>
      <div class="flex items-center gap-2 opacity-40">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border" style="border-color: var(--color-border);">3</div>
        <span class="text-sm">Tour 360°</span>
      </div>
    </div>

    <h1 class="text-3xl font-black tracking-tight mb-2" style="font-family: var(--font-heading);">
      Publicar listado
    </h1>
    <p class="mb-8" style="color: var(--color-muted);">
      Completa los datos de tu propiedad o vehículo
    </p>

    <!-- Error -->
    <div v-if="error" class="alert alert-error mb-6 rounded-xl text-sm">
      {{ error }}
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Tipo -->
      <div>
        <label class="text-sm font-semibold block mb-3">¿Qué quieres publicar?</label>
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="t in [ListingType.APARTMENT, ListingType.HOUSE, ListingType.VEHICLE]"
            :key="t"
            type="button"
            class="p-4 rounded-xl border-2 text-center transition-all cursor-pointer"
            :class="form.type === t ? 'border-[var(--color-neon)] bg-[var(--color-neon)]/10' : 'border-[var(--color-border)] hover:border-gray-300'"
            @click="form.type = t"
          >
            <span class="text-2xl block mb-1">{{ ListingTypeIcons[t] }}</span>
            <span class="text-sm font-semibold">{{ ListingTypeLabels[t] }}</span>
          </button>
        </div>
      </div>

      <template v-if="form.type">
        <!-- Título -->
        <div>
          <label class="text-sm font-semibold block mb-2" for="form-title">Título</label>
          <input
            v-model="form.title"
            id="form-title"
            type="text"
            class="input input-bordered w-full rounded-xl"
            placeholder="Ej: Apartamento moderno en Piantini con vista al mar"
            required
            minlength="5"
          />
        </div>

        <!-- Descripción -->
        <div>
          <label class="text-sm font-semibold block mb-2" for="form-description">Descripción</label>
          <textarea
            v-model="form.description"
            id="form-description"
            class="textarea textarea-bordered w-full rounded-xl"
            rows="4"
            placeholder="Describe tu propiedad en detalle..."
            required
            minlength="20"
          />
        </div>

        <!-- Precio -->
        <div class="grid grid-cols-3 gap-4">
          <div class="col-span-2">
            <label class="text-sm font-semibold block mb-2" for="form-price">Precio</label>
            <input
              v-model.number="form.price"
              id="form-price"
              type="number"
              class="input input-bordered w-full rounded-xl"
              placeholder="150000"
              required
              min="1"
            />
          </div>
          <div>
            <label class="text-sm font-semibold block mb-2" for="form-currency">Moneda</label>
            <select v-model="form.currency" id="form-currency" class="select select-bordered w-full rounded-xl">
              <option value="USD">USD</option>
              <option value="DOP">DOP</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        <!-- Campos de inmueble -->
        <template v-if="isRealEstate">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label class="text-sm font-semibold block mb-2">Área (m²)</label>
              <input v-model.number="form.areaM2" type="number" class="input input-bordered w-full rounded-xl" placeholder="120" />
            </div>
            <div>
              <label class="text-sm font-semibold block mb-2">Habitaciones</label>
              <input v-model.number="form.bedrooms" type="number" class="input input-bordered w-full rounded-xl" placeholder="3" min="0" />
            </div>
            <div>
              <label class="text-sm font-semibold block mb-2">Baños</label>
              <input v-model.number="form.bathrooms" type="number" class="input input-bordered w-full rounded-xl" placeholder="2" min="0" />
            </div>
            <div>
              <label class="text-sm font-semibold block mb-2">Parking</label>
              <input v-model.number="form.parking" type="number" class="input input-bordered w-full rounded-xl" placeholder="1" min="0" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-semibold block mb-2">Ciudad</label>
              <input v-model="form.city" type="text" class="input input-bordered w-full rounded-xl" placeholder="Santo Domingo" required />
            </div>
            <div>
              <label class="text-sm font-semibold block mb-2">Sector</label>
              <input v-model="form.sector" type="text" class="input input-bordered w-full rounded-xl" placeholder="Piantini" />
            </div>
          </div>
        </template>

        <!-- Campos de vehículo -->
        <template v-if="isVehicle">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-semibold block mb-2">Marca</label>
              <input v-model="form.brand" type="text" class="input input-bordered w-full rounded-xl" placeholder="Toyota" required />
            </div>
            <div>
              <label class="text-sm font-semibold block mb-2">Modelo</label>
              <input v-model="form.model" type="text" class="input input-bordered w-full rounded-xl" placeholder="Corolla" required />
            </div>
            <div>
              <label class="text-sm font-semibold block mb-2">Año</label>
              <input v-model.number="form.year" type="number" class="input input-bordered w-full rounded-xl" placeholder="2024" required min="1900" />
            </div>
            <div>
              <label class="text-sm font-semibold block mb-2">Kilometraje</label>
              <input v-model.number="form.mileageKm" type="number" class="input input-bordered w-full rounded-xl" placeholder="15000" min="0" />
            </div>
          </div>
        </template>

        <!-- Submit -->
        <button
          type="submit"
          class="btn btn-neon w-full btn-lg"
          :disabled="isSubmitting"
          id="form-submit"
        >
          {{ isSubmitting ? 'Publicando...' : 'Continuar → Fotos' }}
        </button>
      </template>
    </form>
  </div>
</template>
