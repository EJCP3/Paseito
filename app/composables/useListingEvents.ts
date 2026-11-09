// Analítica anónima de anuncios (POST /api/listings/:id/events). Nunca bloquea ni muestra errores.
// No-op en SSR y si el navegador pide no ser rastreado (Do Not Track / Global Privacy Control).
import type { EventInput } from '~~/shared/schemas/event.schema'

type Extra = { channel?: 'whatsapp' | 'instagram' | 'facebook' | 'tiktok' | 'website'; value?: number }

export function useListingEvents() {
  function track(listingId: string, type: EventInput['type'], extra?: Extra) {
    if (import.meta.server || typeof navigator === 'undefined') return
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean }
    if (nav.doNotTrack === '1' || nav.globalPrivacyControl) return
    try {
      const url = `/api/listings/${encodeURIComponent(listingId)}/events`
      const json = JSON.stringify({ type, ...extra })
      const sent = typeof nav.sendBeacon === 'function' && nav.sendBeacon(url, new Blob([json], { type: 'application/json' }))
      if (!sent) fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: json, keepalive: true }).catch(() => {})
    } catch { /* la analítica nunca rompe la página */ }
  }
  return { track }
}
