export interface Announcement {
  title: string
  description: string
  link?: string
}

function formatLocation(l: any): string {
  if (l.city && l.sector) return `${l.sector}, ${l.city}`
  if (l.city) return l.city
  return ''
}

function formatPrice(l: any): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: l.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(Number(l.price))
}

export function useAnnouncements() {
  // Los mismos anuncios activos que se ven en el home — el ticker es un
  // reflejo de la data real, no copy promocional fijo.
  const { data } = useFetch('/api/listings', {
    query: { limit: 12 },
    key: 'ticker-listings',
  })

  const announcements = computed<Announcement[]>(() =>
    ((data.value as any)?.data ?? []).map((l: any) => ({
      title: l.title,
      description: [formatLocation(l), formatPrice(l)].filter(Boolean).join(' — '),
      link: `/anuncio/${l.slug}`,
    }))
  )

  return { announcements }
}
