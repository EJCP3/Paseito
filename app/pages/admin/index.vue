<script setup lang="ts">
definePageMeta({ middleware: 'admin' })
useHead({ title: 'Administración — Paseito', meta: [{ name: 'robots', content: 'noindex' }] })

/**
 * Panel de admin (RQ-ADMIN-01/02/03): anuncios, reportes, usuarios y auditoría.
 * Tarjetas en vez de tablas para que funcione a 375px. El servidor protege con requireAdmin.
 */
type Tab = 'listings' | 'reports' | 'users' | 'audit'
const TABS: { id: Tab; label: string }[] = [
  { id: 'listings', label: 'Anuncios' },
  { id: 'reports', label: 'Reportes' },
  { id: 'users', label: 'Usuarios' },
  { id: 'audit', label: 'Auditoría' },
]
const tab = ref<Tab>('listings')

const STATUS_LABELS: Record<string, string> = { DRAFT: 'Borrador', ACTIVE: 'Activo', PAUSED: 'Pausado', PENDING_REVIEW: 'En revisión', SOLD: 'Vendido' }
const REASON_LABELS: Record<string, string> = { SPAM: 'Spam', FRAUD: 'Fraude', INAPPROPRIATE: 'Inapropiado', MISLEADING_PRICE: 'Precio engañoso', OTHER: 'Otro' }
const REPORT_STATUS: Record<string, string> = { OPEN: 'Abierto', RESOLVED: 'Resuelto', DISMISSED: 'Descartado' }

const fmt = (d: string) => new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d))

// --- Anuncios ---
const lStatus = ref('')
const lQ = ref('')
const lPage = ref(1)
const { data: listings, refresh: refreshListings } = useFetch<any>('/api/admin/listings', {
  query: computed(() => ({ status: lStatus.value || undefined, q: lQ.value || undefined, page: lPage.value })),
  watch: [lStatus, lQ, lPage],
})

// --- Reportes ---
const rStatus = ref('OPEN')
const rPage = ref(1)
const { data: reports, refresh: refreshReports } = useFetch<any>('/api/admin/reports', {
  query: computed(() => ({ status: rStatus.value || undefined, page: rPage.value })),
  watch: [rStatus, rPage],
})

// --- Usuarios ---
const uQ = ref('')
const uPage = ref(1)
const { data: users, refresh: refreshUsers } = useFetch<any>('/api/admin/users', {
  query: computed(() => ({ q: uQ.value || undefined, page: uPage.value })),
  watch: [uQ, uPage],
})

// --- Auditoría ---
const { data: audit, refresh: refreshAudit } = useFetch<any[]>('/api/admin/audit')

watch([lQ, lStatus], () => { lPage.value = 1 })
watch(rStatus, () => { rPage.value = 1 })
watch(uQ, () => { uPage.value = 1 })

const error = ref('')
const busy = ref(false)

async function act(url: string, body: Record<string, unknown>) {
  error.value = ''
  busy.value = true
  try {
    await $fetch(url, { method: 'PATCH', body })
    await Promise.all([refreshListings(), refreshReports(), refreshUsers(), refreshAudit()])
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'No se pudo completar la acción.'
  } finally {
    busy.value = false
  }
}

function unpauseListing(id: string) {
  if (confirm('¿Quitar la pausa de moderación? El dueño podrá reanudarlo.')) act(`/api/admin/listings/${id}`, { action: 'unpause' })
}
function reportAction(id: string, action: 'resolve' | 'dismiss') {
  act(`/api/admin/reports/${id}`, { action })
}
function userAction(u: any, action: 'suspend' | 'reactivate') {
  const msg = action === 'suspend'
    ? `¿Suspender a ${u.email}? Perderá su sesión y sus anuncios activos se pausarán.`
    : `¿Reactivar a ${u.email}? Sus anuncios seguirán pausados.`
  if (confirm(msg)) act(`/api/admin/users/${u.id}`, { action })
}

// --- Modal de motivo (obligatorio) para pausar y eliminar ---
const pauseTarget = ref<{ id: string; title: string; action: 'pause' | 'delete' } | null>(null)
const pauseReason = ref('')
function openReason(l: { id: string; title: string }, action: 'pause' | 'delete') {
  pauseTarget.value = { id: l.id, title: l.title, action }
  pauseReason.value = ''
}
async function confirmPause() {
  const reason = pauseReason.value.trim()
  if (reason.length < 3 || reason.length > 300) {
    error.value = 'El motivo debe tener entre 3 y 300 caracteres'
    return
  }
  const { id, action } = pauseTarget.value!
  pauseTarget.value = null
  await act(`/api/admin/listings/${id}`, { action, reason })
}

const btn = 'rounded-full border border-black px-3 py-2 text-sm font-semibold disabled:opacity-50'
const card = 'rounded-2xl bg-white p-4 flex flex-col gap-2 border border-gray-200'
</script>

<template>
  <main class="mx-auto w-full max-w-4xl px-4 py-8">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-black" style="font-family: var(--font-heading);">Administración</h1>
      <NuxtLink to="/" class="text-sm underline">Inicio</NuxtLink>
    </div>

    <div class="flex gap-2 overflow-x-auto mb-4" role="tablist">
      <button
        v-for="t in TABS"
        :key="t.id"
        role="tab"
        :aria-selected="tab === t.id"
        class="rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap border border-black"
        :class="tab === t.id ? 'bg-black text-white' : 'bg-transparent'"
        @click="tab = t.id"
      >{{ t.label }}</button>
    </div>

    <p v-if="error" class="text-sm text-red-600 mb-3" role="alert">{{ error }}</p>

    <!-- ANUNCIOS -->
    <section v-if="tab === 'listings'" class="flex flex-col gap-3">
      <div class="flex flex-col sm:flex-row gap-2">
        <input v-model.lazy="lQ" type="search" placeholder="Buscar por título" class="flex-1 rounded-xl border border-gray-300 p-3 text-sm bg-white">
        <select v-model="lStatus" class="rounded-xl border border-gray-300 p-3 text-sm bg-white">
          <option value="">Todos los estados</option>
          <option v-for="(label, k) in STATUS_LABELS" :key="k" :value="k">{{ label }}</option>
        </select>
      </div>
      <div v-for="l in listings?.data" :key="l.id" :class="card">
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-bold break-words">{{ l.title }}</span>
          <span class="text-xs font-bold rounded-full bg-gray-200 px-2 py-0.5">{{ STATUS_LABELS[l.status] }}</span>
          <span v-if="l.adminPausedAt" class="text-xs font-bold rounded-full bg-amber-200 px-2 py-0.5">Moderación</span>
        </div>
        <p class="text-xs break-all" style="color: var(--color-muted);">{{ l.owner.name }} · {{ l.owner.email }} · {{ fmt(l.createdAt) }}</p>
        <p v-if="l.adminPausedReason" class="text-xs">Motivo: {{ l.adminPausedReason }}</p>
        <div class="flex flex-wrap gap-2 mt-1">
          <NuxtLink :to="`/anuncio/${l.slug}`" target="_blank" :class="btn">Ver</NuxtLink>
          <button v-if="!l.adminPausedAt" :class="btn" :disabled="busy" @click="openReason(l, 'pause')">Pausar</button>
          <button v-else :class="btn" :disabled="busy" @click="unpauseListing(l.id)">Quitar pausa</button>
          <button :class="[btn, 'text-red-600 !border-red-600']" :disabled="busy" @click="openReason(l, 'delete')">Eliminar</button>
        </div>
      </div>
      <p v-if="listings && !listings.data.length" class="text-sm">Sin resultados.</p>
      <div v-if="listings?.totalPages > 1" class="flex items-center gap-3 text-sm">
        <button :class="btn" :disabled="lPage <= 1" @click="lPage--">Anterior</button>
        <span>{{ lPage }} / {{ listings.totalPages }}</span>
        <button :class="btn" :disabled="lPage >= listings.totalPages" @click="lPage++">Siguiente</button>
      </div>
    </section>

    <!-- REPORTES -->
    <section v-if="tab === 'reports'" class="flex flex-col gap-3">
      <select v-model="rStatus" class="rounded-xl border border-gray-300 p-3 text-sm bg-white w-full sm:w-60">
        <option value="OPEN">Abiertos</option>
        <option value="RESOLVED">Resueltos</option>
        <option value="DISMISSED">Descartados</option>
        <option value="">Todos</option>
      </select>
      <div v-for="r in reports?.data" :key="r.id" :class="card">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs font-bold rounded-full bg-gray-200 px-2 py-0.5">{{ REPORT_STATUS[r.status] }}</span>
          <span class="font-bold">{{ REASON_LABELS[r.reason] }}</span>
          <span class="text-xs" style="color: var(--color-muted);">{{ fmt(r.createdAt) }} · {{ r.reporter?.name || 'Anónimo' }}</span>
        </div>
        <p v-if="r.details" class="text-sm break-words">{{ r.details }}</p>
        <p class="text-sm break-words">Anuncio: <NuxtLink :to="`/anuncio/${r.listing.slug}`" target="_blank" class="underline">{{ r.listing.title }}</NuxtLink> ({{ STATUS_LABELS[r.listing.status] }}<template v-if="r.listing.deletedAt">, eliminado</template>)</p>
        <div v-if="r.status === 'OPEN'" class="flex flex-wrap gap-2 mt-1">
          <button :class="btn" :disabled="busy" @click="reportAction(r.id, 'resolve')">Resolver</button>
          <button :class="btn" :disabled="busy" @click="reportAction(r.id, 'dismiss')">Descartar</button>
          <button v-if="!r.listing.adminPausedAt && !r.listing.deletedAt" :class="btn" :disabled="busy" @click="openReason(r.listing, 'pause')">Pausar anuncio</button>
        </div>
      </div>
      <p v-if="reports && !reports.data.length" class="text-sm">Sin reportes.</p>
      <div v-if="reports?.totalPages > 1" class="flex items-center gap-3 text-sm">
        <button :class="btn" :disabled="rPage <= 1" @click="rPage--">Anterior</button>
        <span>{{ rPage }} / {{ reports.totalPages }}</span>
        <button :class="btn" :disabled="rPage >= reports.totalPages" @click="rPage++">Siguiente</button>
      </div>
    </section>

    <!-- USUARIOS -->
    <section v-if="tab === 'users'" class="flex flex-col gap-3">
      <input v-model.lazy="uQ" type="search" placeholder="Buscar por correo o nombre" class="rounded-xl border border-gray-300 p-3 text-sm bg-white">
      <div v-for="u in users?.data" :key="u.id" :class="card">
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-bold break-words">{{ u.name }}</span>
          <span v-if="u.role === 'ADMIN'" class="text-xs font-bold rounded-full bg-black text-white px-2 py-0.5">Admin</span>
          <span v-if="u.suspended" class="text-xs font-bold rounded-full bg-red-200 px-2 py-0.5">Suspendido</span>
        </div>
        <p class="text-xs break-all" style="color: var(--color-muted);">{{ u.email }} · {{ u._count.listings }} anuncios · {{ fmt(u.createdAt) }}</p>
        <div v-if="u.role !== 'ADMIN'" class="flex gap-2 mt-1">
          <button v-if="!u.suspended" :class="[btn, 'text-red-600 !border-red-600']" :disabled="busy" @click="userAction(u, 'suspend')">Suspender</button>
          <button v-else :class="btn" :disabled="busy" @click="userAction(u, 'reactivate')">Reactivar</button>
        </div>
      </div>
      <p v-if="users && !users.data.length" class="text-sm">Sin resultados.</p>
      <div v-if="users?.totalPages > 1" class="flex items-center gap-3 text-sm">
        <button :class="btn" :disabled="uPage <= 1" @click="uPage--">Anterior</button>
        <span>{{ uPage }} / {{ users.totalPages }}</span>
        <button :class="btn" :disabled="uPage >= users.totalPages" @click="uPage++">Siguiente</button>
      </div>
    </section>

    <!-- AUDITORÍA -->
    <section v-if="tab === 'audit'" class="flex flex-col gap-3">
      <div v-for="a in audit" :key="a.id" :class="card">
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-bold">{{ a.action }}</span>
          <span class="text-xs" style="color: var(--color-muted);">{{ fmt(a.createdAt) }}</span>
        </div>
        <p class="text-xs break-all" style="color: var(--color-muted);">
          {{ a.actor?.email || 'Sistema' }} → {{ a.targetType }} {{ a.targetId }}
        </p>
        <p v-if="a.metadata?.reason" class="text-xs break-words">Motivo: {{ a.metadata.reason }}</p>
      </div>
      <p v-if="audit && !audit.length" class="text-sm">Sin acciones registradas.</p>
    </section>

    <!-- Modal de motivo (pausar / eliminar) -->
    <div v-if="pauseTarget" data-theme="light" class="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/50" @click.self="pauseTarget = null">
      <div role="dialog" aria-modal="true" class="w-full max-w-md rounded-3xl bg-white p-6">
        <h2 class="text-lg font-bold mb-1">{{ pauseTarget.action === 'delete' ? 'Eliminar anuncio' : 'Pausar anuncio' }}</h2>
        <p class="text-sm mb-3 break-words" style="color: var(--color-muted);">{{ pauseTarget.title }}</p>
        <textarea v-model="pauseReason" rows="3" maxlength="300" class="w-full rounded-xl border border-gray-300 p-3 text-sm" placeholder="Motivo (3–300 caracteres)" />
        <div class="flex justify-end gap-2 mt-3">
          <button :class="btn" @click="pauseTarget = null">Cancelar</button>
          <button :class="[btn, 'bg-black text-white']" @click="confirmPause">{{ pauseTarget.action === 'delete' ? 'Eliminar' : 'Pausar' }}</button>
        </div>
      </div>
    </div>
  </main>
</template>
