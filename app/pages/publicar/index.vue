<script setup lang="ts">
/**
 * Página de publicación — Formulario de datos del listado
 * Dividido en mini-pasos (Tipo → Información básica → ... → Contacto) para
 * no mostrar todos los campos de golpe; cada paso vive en el mismo `form`
 * reactive, solo cambia qué sección se renderiza.
 */
import {
  ListingType,
  ListingTypeLabels,
  FurnishedStatus,
  FurnishedStatusLabels,
  PropertyCondition,
  PropertyConditionLabels,
  BUILDING_AMENITIES,
} from '~~/shared/types/enums'
import { parseContactValue } from '~~/shared/schemas/contact.schema'
import locations from '~~/shared/data/rd-locations.json'

// Opciones del selector — icono SVG por tipo
const publishTypes = [
  { type: ListingType.APARTMENT, icon: 'building', disabled: false },
  { type: ListingType.HOUSE, icon: 'home', disabled: false },
  { type: ListingType.VILLA, icon: 'villa', disabled: false },
]

// key por fullPath: /publicar?id=X → /publicar no reutiliza el formulario relleno
definePageMeta({ middleware: 'auth', key: r => r.fullPath })

useHead({
  title: 'Publicar — Paseito',
})

const router = useRouter()
const route = useRoute()
// ?id= → modo edición: carga el anuncio del dueño y guarda con PATCH (el tipo no cambia)
const editId = computed(() => (typeof route.query.id === 'string' ? route.query.id : ''))
const isEditing = computed(() => !!editId.value)
const loadingEdit = ref(!!editId.value)
const { user, isAuthenticated } = useAuth()
const showVerifyModal = ref(false)
const needsVerification = computed(() => !isEditing.value && isAuthenticated.value && !user.value?.emailVerified)

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
  // Comunes a apartamento/casa/villa
  furnished: '' as string,
  petsAllowed: null as boolean | null,
  condition: '' as string,
  constructionYear: null as number | null,
  amenities: [] as string[],
})

// Campos propios de cada tipo — cada uno vive en su propio subcomponente
// (ApartmentFields/HouseFields/VillaFields) montado condicionalmente abajo.
const apartmentFields = reactive({
  mode: '',
  floorNumber: null as number | null,
  totalFloors: null as number | null,
  hasElevator: null as boolean | null,
  water24h: null as boolean | null,
  power24h: null as boolean | null,
  hasBalcony: null as boolean | null,
  maintenanceFee: null as number | null,
})

const houseFields = reactive({
  mode: '',
  floors: null as number | null,
  hasPatio: null as boolean | null,
  patioSize: null as number | null,
  hasPool: null as boolean | null,
  hasGarage: null as boolean | null,
  garageSpots: null as number | null,
  hasCistern: null as boolean | null,
  hasGenerator: null as boolean | null,
  landAreaM2: null as number | null,
})

const villaFields = reactive({
  villaPoolType: '',
  villaPoolSize: null as number | null,
  guestCapacity: null as number | null,
  bedsCount: null as number | null,
  villaServices: [] as string[],
  pricePerDay: null as number | null,
  pricePerWeek: null as number | null,
  minNights: null as number | null,
  securityDeposit: null as number | null,
  cancellationPolicy: '',
  checkInTime: '',
  checkOutTime: '',
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
  if (!u || isEditing.value) return
  for (const c of contactChannels) {
    const v = (u as any)?.[c.profileKey] || ''
    if (v && !contacts[c.type]!.value) {
      contacts[c.type]!.value = v
      contacts[c.type]!.show = true
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

// Validación por red: error concreto si el valor no corresponde al formato esperado.
// Vacío = válido (el contacto es opcional).
const contactErrors = computed<Record<string, string>>(() => {
  const errs: Record<string, string> = {}
  for (const c of contactChannels) {
    const v = contacts[c.type]!.value.trim()
    if (!v) continue
    const result = parseContactValue(c.type, v)
    if (!result.ok) errs[c.type] = result.error
  }
  return errs
})
const hasContactErrors = computed(() => Object.keys(contactErrors.value).length > 0)

// Rellena el formulario desde un anuncio existente (Decimal llega como string; contacts es JSON)
function loadForEdit(l: Record<string, any>) {
  const num = (v: unknown) => (v === null || v === undefined || v === '' ? null : Number(v))
  form.type = l.type
  form.title = l.title ?? ''
  form.description = l.description ?? ''
  form.price = form.type === ListingType.VILLA ? null : num(l.price)
  form.currency = l.currency ?? 'USD'
  form.sector = l.sector ?? ''
  form.city = l.city ?? ''
  form.latitude = l.latitude ?? null
  form.longitude = l.longitude ?? null
  for (const k of ['areaM2', 'bedrooms', 'bathrooms', 'parking', 'constructionYear'] as const) form[k] = num(l[k])
  form.furnished = l.furnished ?? ''
  form.condition = l.condition ?? ''
  form.petsAllowed = l.petsAllowed ?? null
  form.amenities = [...(l.amenities ?? [])]

  const decimals = ['maintenanceFee', 'pricePerDay', 'pricePerWeek', 'securityDeposit']
  const fill = (target: Record<string, any>) => {
    for (const k of Object.keys(target)) {
      const v = l[k]
      if (v === null || v === undefined) continue
      target[k] = Array.isArray(v) ? [...v] : decimals.includes(k) ? Number(v) : v
    }
  }
  if (form.type === ListingType.APARTMENT) fill(apartmentFields)
  if (form.type === ListingType.HOUSE) fill(houseFields)
  if (form.type === ListingType.VILLA) fill(villaFields)

  // Los contactos guardados mandan sobre el prellenado del perfil
  for (const c of contactChannels) contacts[c.type] = { value: '', show: false }
  for (const c of Array.isArray(l.contacts) ? l.contacts : []) {
    if (contacts[c?.type]) contacts[c.type] = { value: String(c.value ?? ''), show: true }
  }
  substep.value = 1 // el tipo ya está decidido
}

onMounted(async () => {
  if (!editId.value) return
  try {
    loadForEdit(await $fetch<any>(`/api/listings/${editId.value}`))
  } catch {
    error.value = 'No se pudo cargar el anuncio para editarlo.'
  } finally {
    loadingEdit.value = false
  }
})

const isSubmitting = ref(false)
const error = ref<string | null>(null)

const isRealEstate = computed(() => form.type === ListingType.APARTMENT || form.type === ListingType.HOUSE || form.type === ListingType.VILLA)

function toggleAmenity(amenity: string) {
  const idx = form.amenities.indexOf(amenity)
  if (idx === -1) form.amenities.push(amenity)
  else form.amenities.splice(idx, 1)
}

// Apartamento y casa requieren elegir modalidad; la villa siempre es alquiler
// por día (fijo, sin selector).
const modeMissing = computed(() =>
  (form.type === ListingType.APARTMENT && !apartmentFields.mode) ||
  (form.type === ListingType.HOUSE && !houseFields.mode)
)

// ============================================
// Mini-pasos — el "Datos" del wizard grande se divide en pantallas cortas
// ============================================
const substep = ref(0)

const stepDefs = computed(() => {
  const detalleLabel = form.type === ListingType.VILLA
    ? 'Detalles de la villa'
    : form.type === ListingType.HOUSE
      ? 'Detalles de la casa'
      : 'Detalles del apartamento'

  return [
    { key: 'tipo', label: 'Tipo' },
    { key: 'basico', label: 'Información básica' },
    { key: 'ubicacion', label: 'Ubicación' },
    { key: 'caracteristicas', label: 'Características' },
    { key: 'detalle-tipo', label: detalleLabel },
    { key: 'contacto', label: 'Contacto' },
  ]
})

const currentStepKey = computed(() => stepDefs.value[substep.value]?.key ?? 'tipo')
const isFirstStep = computed(() => substep.value === 0)
const isLastStep = computed(() => substep.value === stepDefs.value.length - 1)

// Qué falta en el paso actual para poder avanzar (lista vacía = paso válido).
// Sustituye la validación nativa del navegador, que dejó de aplicarse a los
// campos de otros pasos en cuanto se sacan del DOM con v-if. Al intentar
// avanzar mostramos exactamente qué campos obligatorios faltan.
const stepMissing = computed<string[]>(() => {
  const missing: string[] = []
  switch (currentStepKey.value) {
    case 'basico':
      if (form.title.trim().length < 5) missing.push('Título (mínimo 5 caracteres)')
      if (form.description.trim().length < 20) missing.push('Descripción (mínimo 20 caracteres)')
      if (form.type !== ListingType.VILLA && !(form.price !== null && form.price > 0)) missing.push('Precio')
      break
    case 'ubicacion':
      if (!form.city) missing.push('Ciudad')
      else if (cityInvalid.value) missing.push('Una ciudad válida de la lista')
      if (!locationConfirmed.value) missing.push('Confirmar la ubicación exacta en el mapa')
      break
    case 'detalle-tipo':
      if (form.type === ListingType.APARTMENT && !apartmentFields.mode) missing.push('Modalidad (alquiler o venta)')
      if (form.type === ListingType.HOUSE && !houseFields.mode) missing.push('Modalidad (alquiler o venta)')
      if (form.type === ListingType.VILLA && !villaFields.pricePerDay) missing.push('Precio por día')
      break
    case 'contacto':
      if (hasContactErrors.value) missing.push('Corregir el formato de los contactos marcados')
      break
  }
  return missing
})
const stepValid = computed(() => stepMissing.value.length === 0)

function selectType(type: string) {
  form.type = type
  error.value = null
  substep.value = 1 // elegir tipo ya es la acción del paso 0, no hace falta un "Siguiente" aparte
}

function goNext() {
  if (!stepValid.value) {
    error.value = `Falta completar: ${stepMissing.value.join(', ')}.`
    return
  }
  error.value = null
  if (substep.value < stepDefs.value.length - 1) substep.value++
}

function goBack() {
  error.value = null
  if (substep.value > 0) substep.value--
}

function goToStep(key: string) {
  const idx = stepDefs.value.findIndex((s) => s.key === key)
  if (idx !== -1) substep.value = idx
}

async function handleSubmit() {
  // Bloquear si algún contacto escrito no tiene el formato de su red
  if (hasContactErrors.value) {
    goToStep('contacto')
    error.value = 'Revisa los datos de contacto: hay campos con formato inválido.'
    return
  }

  // Bloquear solo la ciudad (el sector puede ser texto libre)
  if (isRealEstate.value && cityInvalid.value) {
    goToStep('ubicacion')
    error.value = 'Selecciona una ciudad válida de la lista.'
    return
  }

  // La ubicación exacta (pin en el mapa) es necesaria para detectar los
  // puntos de interés cercanos — sin ella no publicamos un inmueble.
  if (isRealEstate.value && !locationConfirmed.value) {
    goToStep('ubicacion')
    error.value = 'Confirma la ubicación de tu propiedad en el mapa.'
    return
  }

  // Apartamento/casa necesitan modalidad (alquiler o venta); la villa es fija.
  if (modeMissing.value) {
    goToStep('detalle-tipo')
    error.value = 'Elige si el anuncio es en alquiler o en venta.'
    return
  }

  if (form.type === ListingType.VILLA && !villaFields.pricePerDay) {
    goToStep('detalle-tipo')
    error.value = 'El precio por día es obligatorio para una villa.'
    return
  }

  isSubmitting.value = true
  error.value = null

  try {
    const body: Record<string, any> = {
      type: form.type,
      title: form.title,
      description: form.description,
      // El precio "de lista" de una villa es su precio por día (mismo campo
      // que usan el buscador y las tarjetas de listado para todos los tipos).
      price: form.type === ListingType.VILLA ? villaFields.pricePerDay : form.price,
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

      if (form.furnished) body.furnished = form.furnished
      if (form.petsAllowed !== null) body.petsAllowed = form.petsAllowed
      if (form.condition) body.condition = form.condition
      if (form.constructionYear) body.constructionYear = form.constructionYear
      body.amenities = form.amenities
    }

    if (form.type === ListingType.APARTMENT) {
      body.mode = apartmentFields.mode
      for (const key of ['floorNumber', 'totalFloors', 'hasElevator', 'water24h', 'power24h', 'hasBalcony', 'maintenanceFee'] as const) {
        const value = apartmentFields[key]
        if (value !== null && (value as unknown) !== '') body[key] = value // v-model.number deja '' al vaciar el campo
      }
    }

    if (form.type === ListingType.HOUSE) {
      body.mode = houseFields.mode
      for (const key of ['floors', 'hasPatio', 'patioSize', 'hasPool', 'hasGarage', 'garageSpots', 'hasCistern', 'hasGenerator', 'landAreaM2'] as const) {
        const value = houseFields[key]
        if (value !== null && (value as unknown) !== '') body[key] = value // v-model.number deja '' al vaciar el campo
      }
    }

    if (form.type === ListingType.VILLA) {
      for (const key of ['villaPoolType', 'villaPoolSize', 'guestCapacity', 'bedsCount', 'pricePerDay', 'pricePerWeek', 'minNights', 'securityDeposit', 'cancellationPolicy', 'checkInTime', 'checkOutTime'] as const) {
        const value = villaFields[key]
        if (value !== null && (value as unknown) !== '') body[key] = value // v-model.number deja '' al vaciar el campo
      }
      body.villaServices = villaFields.villaServices
    }

    // Redes/contactos elegidos (solo los marcados y con valor)
    const chosenContacts = contactChannels
      .filter(c => contacts[c.type]!.show && contacts[c.type]!.value.trim())
      .map(c => ({ type: c.type, value: contacts[c.type]!.value.trim() }))
    // En edición siempre se envía (lista vacía = quitar todos); al crear, solo si hay
    if (isEditing.value || chosenContacts.length) body.contacts = chosenContacts

    if (isEditing.value) {
      delete body.type // el tipo no se cambia
      // Opcionales vaciados → null para que el servidor los borre (solo columnas nullable)
      const clearable = ['areaM2', 'bedrooms', 'bathrooms', 'parking', 'sector', 'furnished', 'petsAllowed', 'condition', 'constructionYear',
        ...(form.type === ListingType.APARTMENT ? ['floorNumber', 'totalFloors', 'hasElevator', 'water24h', 'power24h', 'hasBalcony', 'maintenanceFee'] : []),
        ...(form.type === ListingType.HOUSE ? ['floors', 'hasPatio', 'patioSize', 'hasPool', 'hasGarage', 'garageSpots', 'hasCistern', 'hasGenerator', 'landAreaM2'] : []),
        ...(form.type === ListingType.VILLA ? ['villaPoolType', 'villaPoolSize', 'guestCapacity', 'bedsCount', 'pricePerWeek', 'minNights', 'securityDeposit', 'cancellationPolicy', 'checkInTime', 'checkOutTime'] : []),
      ]
      for (const k of clearable) if (!(k in body)) body[k] = null
      await $fetch(`/api/listings/${editId.value}`, { method: 'PATCH', body })
      await router.push('/cuenta')
      return
    }

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
    error.value = err.data?.message || err.data?.statusMessage || err.message || 'Error al guardar el anuncio'
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
      <div class="flex-1 h-px" style="background: var(--color-border);"/>
      <div class="flex items-center gap-2 opacity-40">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border" style="border-color: var(--color-border);">2</div>
        <span class="text-sm">Fotos</span>
      </div>
      <div class="flex-1 h-px" style="background: var(--color-border);"/>
      <div class="flex items-center gap-2 opacity-40">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border" style="border-color: var(--color-border);">3</div>
        <span class="text-sm">Tour 360°</span>
      </div>
    </div>

    <h1 class="text-3xl font-black tracking-tight mb-2" style="font-family: var(--font-heading);">
      {{ isEditing ? 'Editar anuncio' : 'Publicar anuncio' }}
    </h1>

    <div v-if="loadingEdit" class="py-16 text-center" style="color: var(--color-muted);">Cargando…</div>

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

    <template v-else-if="!loadingEdit">
      <!-- Mini-progreso de los pasos de "Datos" -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-semibold">{{ stepDefs[substep]?.label }}</span>
          <span class="text-xs" style="color: var(--color-muted);">Paso {{ substep + 1 }} de {{ stepDefs.length }}</span>
        </div>
        <div class="flex gap-1.5">
          <div
            v-for="(s, i) in stepDefs"
            :key="s.key"
            class="h-1.5 flex-1 rounded-full transition-colors"
            :style="i <= substep ? 'background: var(--color-neon);' : 'background: var(--color-border);'"
          />
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="alert alert-error mb-6 rounded-xl text-sm">
        {{ error }}
      </div>

      <form class="space-y-6" @submit.prevent="handleSubmit">
        <!-- Paso: Tipo -->
        <div v-if="currentStepKey === 'tipo'">
          <label class="text-sm font-semibold block mb-3">¿Qué quieres publicar?</label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              v-for="opt in publishTypes"
              :key="opt.type"
              type="button"
              :disabled="opt.disabled || isEditing"
              class="relative p-4 rounded-xl border-2 text-center transition-all"
              :class="opt.disabled || isEditing
                ? 'border-[var(--color-border)] opacity-50 cursor-not-allowed'
                : (form.type === opt.type ? 'border-[var(--color-neon)] bg-[var(--color-neon)]/10 cursor-pointer' : 'border-[var(--color-border)] hover:border-gray-300 cursor-pointer')"
              @click="!opt.disabled && selectType(opt.type)"
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

        <!-- Paso: Información básica -->
        <template v-if="currentStepKey === 'basico'">
          <p class="text-xs" style="color: var(--color-muted);">Los campos con <span class="text-red-500">*</span> son obligatorios.</p>
          <label class="field">
            <span class="field-label">Título <span class="text-red-500">*</span></span>
            <input
              v-model="form.title"
              type="text"
              class="field-input"
              placeholder="Ej: Apartamento moderno en Piantini con vista al mar"
              minlength="5"
            >
          </label>

          <label class="field">
            <span class="field-label">Descripción <span class="text-red-500">*</span></span>
            <textarea
              v-model="form.description"
              class="field-input resize-none"
              rows="4"
              placeholder="Describe tu propiedad en detalle..."
              minlength="20"
            />
          </label>

          <!-- Precio (la villa fija su precio por día en sus propios campos) -->
          <div v-if="form.type !== ListingType.VILLA" class="grid grid-cols-3 gap-4">
            <label class="field col-span-2">
              <span class="field-label">Precio <span class="text-red-500">*</span></span>
              <input v-model.number="form.price" type="number" class="field-input" placeholder="150000" min="1" >
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
          <label v-else class="field relative w-1/3">
            <span class="field-label">Moneda</span>
            <select v-model="form.currency" class="field-input">
              <option value="USD">USD</option>
              <option value="DOP">DOP</option>
              <option value="EUR">EUR</option>
            </select>
            <Icon name="chevronDown" class="w-4 h-4 absolute right-4 bottom-3 pointer-events-none" style="color: var(--color-muted);" />
          </label>
        </template>

        <!-- Paso: Ubicación (solo inmuebles) -->
        <template v-if="currentStepKey === 'ubicacion'">
          <div class="grid grid-cols-2 gap-4 items-start">
            <div>
              <label class="field" :style="cityInvalid ? 'border-color: #dc2626;' : ''">
                <span class="field-label">Ciudad <span class="text-red-500">*</span></span>
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
            <label class="field-label">Ubicación exacta <span class="text-red-500">*</span></label>
            <NearbyPlacesPicker
              v-model:lat="form.latitude"
              v-model:lng="form.longitude"
              v-model:excluded-names="discardedPoiNames"
              :city="form.city"
              :sector="form.sector"
            />
          </div>
        </template>

        <!-- Paso: Características (solo inmuebles) -->
        <template v-if="currentStepKey === 'caracteristicas'">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <label class="field">
              <span class="field-label">Área (m²)</span>
              <input v-model.number="form.areaM2" type="number" class="field-input" placeholder="120" >
            </label>
            <label class="field">
              <span class="field-label">Habitaciones</span>
              <input v-model.number="form.bedrooms" type="number" class="field-input" placeholder="3" min="0" >
            </label>
            <label class="field">
              <span class="field-label">Baños</span>
              <input v-model.number="form.bathrooms" type="number" class="field-input" placeholder="2.5" min="0" step="0.5" >
            </label>
            <label class="field">
              <span class="field-label">Parking</span>
              <input v-model.number="form.parking" type="number" class="field-input" placeholder="1" min="0" >
            </label>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <label class="field">
              <span class="field-label">Amueblado</span>
              <select v-model="form.furnished" class="field-input">
                <option value="">Selecciona…</option>
                <option v-for="opt in FurnishedStatus" :key="opt" :value="opt">{{ FurnishedStatusLabels[opt] }}</option>
              </select>
            </label>
            <label class="field">
              <span class="field-label">Estado del inmueble</span>
              <select v-model="form.condition" class="field-input">
                <option value="">Selecciona…</option>
                <option v-for="opt in PropertyCondition" :key="opt" :value="opt">{{ PropertyConditionLabels[opt] }}</option>
              </select>
            </label>
            <label class="field">
              <span class="field-label">Año de construcción</span>
              <input v-model.number="form.constructionYear" type="number" class="field-input" placeholder="2015" >
            </label>
            <div class="flex items-end pb-3">
              <label class="flex items-center gap-2 text-sm">
                <input v-model="form.petsAllowed" type="checkbox" class="w-4 h-4 accent-[var(--color-neon)] cursor-pointer" >
                Acepta mascotas
              </label>
            </div>
          </div>

          <div>
            <span class="field-label">Amenidades del edificio/condominio</span>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="amenity in BUILDING_AMENITIES"
                :key="amenity"
                type="button"
                class="pill"
                :class="{ active: form.amenities.includes(amenity) }"
                @click="toggleAmenity(amenity)"
              >
                {{ amenity }}
              </button>
            </div>
          </div>
        </template>

        <!-- Paso: Detalles específicos del tipo (solo inmuebles) -->
        <template v-if="currentStepKey === 'detalle-tipo'">
          <ApartmentFields v-if="form.type === ListingType.APARTMENT" v-model="apartmentFields" />
          <HouseFields v-else-if="form.type === ListingType.HOUSE" v-model="houseFields" />
          <VillaFields v-else-if="form.type === ListingType.VILLA" v-model="villaFields" />
        </template>

        <!-- Paso: Contacto (último — incluye el botón de publicar) -->
        <template v-if="currentStepKey === 'contacto'">
          <p class="text-xs mb-1" style="color: var(--color-muted);">
            Marca las redes que quieres mostrar en el anuncio. Se prellenan desde tu perfil; puedes agregar las que falten aquí mismo.
          </p>
          <div class="space-y-2">
            <div v-for="c in contactChannels" :key="c.type">
              <div
                class="field"
                :class="{ 'field-active': contacts[c.type]!.show && !contactErrors[c.type] }"
                :style="contactErrors[c.type] ? 'border-color: #dc2626;' : ''"
              >
                <div class="flex items-center gap-2 mb-0.5">
                  <input
                    :id="`contact-${c.type}`"
                    v-model="contacts[c.type]!.show"
                    type="checkbox"
                    class="w-4 h-4 accent-[var(--color-neon)] cursor-pointer flex-shrink-0"
                  >
                  <label :for="`contact-${c.type}`" class="field-label !mb-0 cursor-pointer">{{ c.label }}</label>
                </div>
                <input
                  v-model="contacts[c.type]!.value"
                  type="text"
                  class="field-input"
                  :placeholder="c.placeholder"
                >
              </div>
              <p v-if="contactErrors[c.type]" class="text-xs text-red-600 mt-1 px-1">
                {{ contactErrors[c.type] }}
              </p>
            </div>
          </div>
        </template>

        <!-- Navegación entre pasos -->
        <div class="flex gap-3 pt-2">
          <button
            v-if="!isFirstStep"
            type="button"
            class="btn rounded-full flex-1"
            style="border: 1px solid var(--color-border); background: transparent; color: #171717;"
            @click="goBack"
          >
            Atrás
          </button>

          <!-- Clickeable aunque falten campos: al pulsar muestra qué falta -->
          <button
            v-if="!isLastStep && currentStepKey !== 'tipo'"
            type="button"
            class="btn btn-neon flex-1"
            :class="{ 'opacity-60': !stepValid }"
            @click="goNext"
          >
            Siguiente
          </button>

          <button
            v-if="isLastStep"
            id="form-submit"
            type="submit"
            class="btn btn-neon flex-1"
            :class="{ 'opacity-60': !stepValid }"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Continuar → Fotos' }}
          </button>
        </div>
      </form>
    </template>

    <VerifyEmailModal :show="showVerifyModal" @close="showVerifyModal = false" />
  </div>
</template>
