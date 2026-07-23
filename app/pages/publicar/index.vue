<script setup lang="ts">
/**
 * Página de publicación — Formulario de datos del listado
 */
import { ListingType, ListingTypeLabels } from '~~/shared/types/enums'
import { parseContactValue } from '~~/shared/schemas/contact.schema'
import locations from '~~/shared/data/rd-locations.json'

// Opciones del selector — icono SVG por tipo; Vehículo aún no disponible
const publishTypes = [
  { type: ListingType.APARTMENT, icon: 'building', disabled: false },
  { type: ListingType.HOUSE, icon: 'home', disabled: false },
  { type: ListingType.VILLA, icon: 'villa', disabled: false },
  { type: ListingType.VEHICLE, icon: 'car', disabled: true },
]

useHead({
  title: 'Publicar — Paseito',
})

const router = useRouter()
const { user, isAuthenticated } = useAuth()
const showVerifyModal = ref(false)
const needsVerification = computed(() => isAuthenticated.value && !user.value?.emailVerified)

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
  latitude: null as number | null,
  longitude: null as number | null,
  // Vehículo
  brand: '',
  model: '',
  year: null as number | null,
  mileageKm: null as number | null,
})

// --- Redes/contactos a mostrar en el anuncio ---
// Se prellenan desde el perfil; si el usuario no tiene alguna, puede escribirla aquí.
const contactChannels = [
  { type: 'whatsapp', label: 'WhatsApp', profileKey: 'phone', placeholder: '+1 809 555 1234' },
  { type: 'instagram', label: 'Instagram', profileKey: 'instagramUrl', placeholder: 'https://instagram.com/...' },
  { type: 'facebook', label: 'Facebook', profileKey: 'facebookUrl', placeholder: 'https://facebook.com/...' },
  { type: 'tiktok', label: 'TikTok', profileKey: 'tiktokUrl', placeholder: 'https://tiktok.com/@...' },
  { type: 'website', label: 'Sitio web', profileKey: 'websiteUrl', placeholder: 'https://...' },
] as const

const contacts = reactive<Record<string, { value: string; show: boolean }>>(
  Object.fromEntries(contactChannels.map(c => [c.type, { value: '', show: false }]))
)

// Prellenar cuando la sesión esté disponible (marca por defecto las que ya tiene)
watch(user, (u) => {
  if (!u) return
  for (const c of contactChannels) {
    const v = (u as any)?.[c.profileKey] || ''
    if (v && !contacts[c.type].value) {
      contacts[c.type].value = v
      contacts[c.type].show = true
    }
  }
}, { immediate: true })

// --- Ubicación: solo valores del dataset RD (nada de texto libre) ---
const cityOptions = locations.map((l) => l.city)
const sectorOptions = computed(() =>
  locations.find((l) => l.city === form.city)?.sectors ?? []
)
const cityInvalid = computed(() => !!form.city && !cityOptions.includes(form.city))
// Sector: si no está en la lista, se acepta como texto libre (barrios/sectores
// nuevos que no estén en el dataset RD).

// Al cambiar de ciudad, limpiar el sector si ya no pertenece a la nueva ciudad
watch(() => form.city, () => {
  if (form.sector && !sectorOptions.value.includes(form.sector)) form.sector = ''
})

// POIs descartados a mano en el preview del mini-mapa (por nombre, no se editan)
const discardedPoiNames = ref<string[]>([])
const locationConfirmed = computed(() => form.latitude !== null && form.longitude !== null)

// Acordeón de la sección de contacto (colapsable)
const showContacts = ref(true)

// Validación por red: error concreto si el valor no corresponde al formato esperado.
// Vacío = válido (el contacto es opcional).
const contactErrors = computed<Record<string, string>>(() => {
  const errs: Record<string, string> = {}
  for (const c of contactChannels) {
    const v = contacts[c.type].value.trim()
    if (!v) continue
    const result = parseContactValue(c.type, v)
    if (!result.ok) errs[c.type] = result.error
  }
  return errs
})
const hasContactErrors = computed(() => Object.keys(contactErrors.value).length > 0)

const isSubmitting = ref(false)
const error = ref<string | null>(null)

const isRealEstate = computed(() => form.type === ListingType.APARTMENT || form.type === ListingType.HOUSE || form.type === ListingType.VILLA)
const isVehicle = computed(() => form.type === ListingType.VEHICLE)

async function handleSubmit() {
  // Bloquear si algún contacto escrito no tiene el formato de su red
  if (hasContactErrors.value) {
    showContacts.value = true
    error.value = 'Revisa los datos de contacto: hay campos con formato inválido.'
    return
  }

  // Bloquear solo la ciudad (el sector puede ser texto libre)
  if (isRealEstate.value && cityInvalid.value) {
    error.value = 'Selecciona una ciudad válida de la lista.'
    return
  }

  // La ubicación exacta (pin en el mapa) es necesaria para detectar los
  // puntos de interés cercanos — sin ella no publicamos un inmueble.
  if (isRealEstate.value && !locationConfirmed.value) {
    error.value = 'Confirma la ubicación de tu propiedad en el mapa.'
    return
  }

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
      if (form.latitude !== null) body.latitude = form.latitude
      if (form.longitude !== null) body.longitude = form.longitude
    }

    if (isVehicle.value) {
      if (form.brand) body.brand = form.brand
      if (form.model) body.model = form.model
      if (form.year) body.year = form.year
      if (form.mileageKm !== null) body.mileageKm = form.mileageKm
    }

    // Redes/contactos elegidos (solo los marcados y con valor)
    const chosenContacts = contactChannels
      .filter(c => contacts[c.type].show && contacts[c.type].value.trim())
      .map(c => ({ type: c.type, value: contacts[c.type].value.trim() }))
    if (chosenContacts.length) body.contacts = chosenContacts

    const listing = await $fetch('/api/listings', { method: 'POST', body })
    const listingId = (listing as any).id

    // Detección de POIs cercanos: se dispara una sola vez, justo al publicar.
    // Si Overpass falla no debe bloquear el flujo — el listado ya se creó.
    if (isRealEstate.value && form.latitude !== null && form.longitude !== null) {
      try {
        await $fetch(`/api/listings/${listingId}/nearby-places`, {
          method: 'POST',
          body: { lat: form.latitude, lng: form.longitude, excludeNames: discardedPoiNames.value },
        })
      } catch {
        // Se ignora: el anuncio queda publicado igual, sin puntos de interés.
      }
    }

    // Redirigir al paso de fotos
    router.push(`/publicar/fotos?id=${listingId}`)
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Error al crear el anuncio'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 md:py-12">
    <!-- Salir del formulario -->
    <div class="flex justify-end mb-4">
      <button
        type="button"
        class="text-sm font-medium flex items-center gap-1.5 hover:opacity-70 transition-opacity"
        style="color: var(--color-muted);"
        @click="router.push('/')"
      >
        <Icon name="close" class="w-4 h-4" />
        Salir
      </button>
    </div>

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
      Publicar anuncio
    </h1>
    <p class="mb-8" style="color: var(--color-muted);">
      Completa los datos de tu propiedad
    </p>

    <!-- Bloqueo por correo sin verificar -->
    <div v-if="needsVerification" class="text-center py-16 rounded-2xl" style="background: #fef3c7; border: 2px dashed #f59e0b;">
      <Icon name="alertCircle" class="w-12 h-12 mx-auto mb-4" stroke="#92400e" stroke-width="1.5" />
      <p class="font-bold" style="font-family: var(--font-heading); color: #92400e;">Verifica tu correo para publicar</p>
      <p class="text-sm mt-1 mb-6" style="color: #92400e;">
        Necesitas verificar tu correo electrónico antes de poder publicar un anuncio.
      </p>
      <button type="button" class="btn btn-neon" @click="showVerifyModal = true">
        Verificar correo
      </button>
    </div>

    <template v-else>
      <!-- Error -->
      <div v-if="error" class="alert alert-error mb-6 rounded-xl text-sm">
        {{ error }}
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Tipo -->
      <div>
        <label class="text-sm font-semibold block mb-3">¿Qué quieres publicar?</label>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            v-for="opt in publishTypes"
            :key="opt.type"
            type="button"
            :disabled="opt.disabled"
            class="relative p-4 rounded-xl border-2 text-center transition-all"
            :class="opt.disabled
              ? 'border-[var(--color-border)] opacity-50 cursor-not-allowed'
              : (form.type === opt.type ? 'border-[var(--color-neon)] bg-[var(--color-neon)]/10 cursor-pointer' : 'border-[var(--color-border)] hover:border-gray-300 cursor-pointer')"
            @click="!opt.disabled && (form.type = opt.type)"
          >
            <span
              v-if="opt.disabled"
              class="absolute top-1.5 right-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none"
              style="background: var(--color-border); color: var(--color-muted);"
            >Próximamente</span>

            <Icon :name="opt.icon" class="w-7 h-7 mx-auto mb-1.5" />
            <span class="text-sm font-semibold">{{ ListingTypeLabels[opt.type] }}</span>
          </button>
        </div>
      </div>

      <template v-if="form.type">
        <!-- Título -->
        <label class="field">
          <span class="field-label">Título</span>
          <input
            v-model="form.title"
            type="text"
            class="field-input"
            placeholder="Ej: Apartamento moderno en Piantini con vista al mar"
            required
            minlength="5"
          />
        </label>

        <!-- Descripción -->
        <label class="field">
          <span class="field-label">Descripción</span>
          <textarea
            v-model="form.description"
            class="field-input resize-none"
            rows="4"
            placeholder="Describe tu propiedad en detalle..."
            required
            minlength="20"
          />
        </label>

        <!-- Precio -->
        <div class="grid grid-cols-3 gap-4">
          <label class="field col-span-2">
            <span class="field-label">Precio</span>
            <input
              v-model.number="form.price"
              type="number"
              class="field-input"
              placeholder="150000"
              required
              min="1"
            />
          </label>
          <label class="field relative">
            <span class="field-label">Moneda</span>
            <select v-model="form.currency" class="field-input">
              <option value="USD">USD</option>
              <option value="DOP">DOP</option>
              <option value="EUR">EUR</option>
            </select>
            <Icon name="chevronDown" class="w-4 h-4 absolute right-4 bottom-3 pointer-events-none" style="color: var(--color-muted);" />
          </label>
        </div>

        <!-- Campos de inmueble -->
        <template v-if="isRealEstate">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <label class="field">
              <span class="field-label">Área (m²)</span>
              <input v-model.number="form.areaM2" type="number" class="field-input" placeholder="120" />
            </label>
            <label class="field">
              <span class="field-label">Habitaciones</span>
              <input v-model.number="form.bedrooms" type="number" class="field-input" placeholder="3" min="0" />
            </label>
            <label class="field">
              <span class="field-label">Baños</span>
              <input v-model.number="form.bathrooms" type="number" class="field-input" placeholder="2" min="0" />
            </label>
            <label class="field">
              <span class="field-label">Parking</span>
              <input v-model.number="form.parking" type="number" class="field-input" placeholder="1" min="0" />
            </label>
          </div>
          <div class="grid grid-cols-2 gap-4 items-start">
            <div>
              <label class="field" :style="cityInvalid ? 'border-color: #dc2626;' : ''">
                <span class="field-label">Ciudad</span>
                <LocationCombobox v-model="form.city" :options="cityOptions" placeholder="Escribe para buscar…" />
              </label>
              <p v-if="cityInvalid" class="text-xs text-red-600 mt-1 px-1">
                Selecciona una ciudad válida de la lista.
              </p>
            </div>
            <div>
              <label class="field" :class="{ 'opacity-50': !form.city }">
                <span class="field-label">Sector</span>
                <LocationCombobox
                  v-model="form.sector"
                  :options="sectorOptions"
                  :disabled="!form.city"
                  allow-custom
                  :placeholder="form.city ? 'Escribe para buscar o crea uno nuevo…' : 'Elige una ciudad primero'"
                />
              </label>
            </div>
          </div>

          <!-- Mini-mapa: pin arrastrable para confirmar la ubicación exacta -->
          <div v-if="form.city">
            <label class="field-label">Ubicación exacta</label>
            <NearbyPlacesPicker
              v-model:lat="form.latitude"
              v-model:lng="form.longitude"
              v-model:excluded-names="discardedPoiNames"
              :city="form.city"
              :sector="form.sector"
            />
          </div>
        </template>

        <!-- Campos de vehículo -->
        <template v-if="isVehicle">
          <div class="grid grid-cols-2 gap-4">
            <label class="field">
              <span class="field-label">Marca</span>
              <input v-model="form.brand" type="text" class="field-input" placeholder="Toyota" required />
            </label>
            <label class="field">
              <span class="field-label">Modelo</span>
              <input v-model="form.model" type="text" class="field-input" placeholder="Corolla" required />
            </label>
            <label class="field">
              <span class="field-label">Año</span>
              <input v-model.number="form.year" type="number" class="field-input" placeholder="2024" required min="1900" />
            </label>
            <label class="field">
              <span class="field-label">Kilometraje</span>
              <input v-model.number="form.mileageKm" type="number" class="field-input" placeholder="15000" min="0" />
            </label>
          </div>
        </template>

        <!-- Redes / contactos a mostrar en el anuncio (acordeón colapsable) -->
        <div class="rounded-2xl overflow-hidden" style="border: 1px solid var(--color-border);">
          <!-- Cabecera del acordeón -->
          <button
            type="button"
            class="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-black/[0.02] transition-colors"
            :aria-expanded="showContacts"
            @click="showContacts = !showContacts"
          >
            <span class="text-sm font-semibold">Contacto en el anuncio</span>
            <Icon
              name="chevronDown"
              class="w-4 h-4 flex-shrink-0 transition-transform duration-200"
              :class="showContacts ? 'rotate-180' : ''"
              style="color: var(--color-muted);"
            />
          </button>

          <!-- Contenido -->
          <div
            class="grid transition-[grid-template-rows] duration-300 ease-in-out"
            :class="showContacts ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
          >
            <div class="overflow-hidden">
              <div class="px-4 pb-4 pt-1">
                <p class="text-xs mb-3" style="color: var(--color-muted);">
                  Marca las redes que quieres mostrar. Se prellenan desde tu perfil; puedes agregar las que falten aquí mismo.
                </p>
                <div class="space-y-2">
                  <div v-for="c in contactChannels" :key="c.type">
                    <div
                      class="field"
                      :class="{ 'field-active': contacts[c.type].show && !contactErrors[c.type] }"
                      :style="contactErrors[c.type] ? 'border-color: #dc2626;' : ''"
                    >
                      <div class="flex items-center gap-2 mb-0.5">
                        <input
                          type="checkbox"
                          v-model="contacts[c.type].show"
                          :id="`contact-${c.type}`"
                          class="w-4 h-4 accent-[var(--color-neon)] cursor-pointer flex-shrink-0"
                        />
                        <label :for="`contact-${c.type}`" class="field-label !mb-0 cursor-pointer">{{ c.label }}</label>
                      </div>
                      <input
                        v-model="contacts[c.type].value"
                        type="text"
                        class="field-input"
                        :placeholder="c.placeholder"
                      />
                    </div>
                    <p v-if="contactErrors[c.type]" class="text-xs text-red-600 mt-1 px-1">
                      {{ contactErrors[c.type] }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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
    </template>

    <VerifyEmailModal :show="showVerifyModal" @close="showVerifyModal = false" />
  </div>
</template>
