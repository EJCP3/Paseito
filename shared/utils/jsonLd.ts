type Src = {
  slug: string
  type: string
  title: string
  description?: string | null
  price: string | number
  currency?: string | null
  city?: string | null
  sector?: string | null
  latitude?: number | null
  longitude?: number | null
  photos?: { url: string }[]
  scenes?: { previewUrl: string }[]
}

const TYPES: Record<string, string> = { APARTMENT: 'Apartment', HOUSE: 'House' }

export function listingJsonLd(l: Src, appUrl: string) {
  const url = `${appUrl.replace(/\/+$/, '')}/anuncio/${l.slug}`
  const images = l.photos?.length ? l.photos.map((p) => p.url) : (l.scenes ?? []).slice(0, 1).map((s) => s.previewUrl)
  const hasGeo = typeof l.latitude === 'number' && typeof l.longitude === 'number'
  return {
    '@context': 'https://schema.org',
    '@type': TYPES[l.type] ?? 'Residence',
    name: l.title,
    description: l.description || undefined,
    url,
    ...(images.length && { image: images }),
    offers: { '@type': 'Offer', price: Number(l.price), priceCurrency: l.currency || 'USD', availability: 'https://schema.org/InStock', url },
    address: { '@type': 'PostalAddress', addressLocality: l.city || undefined, addressRegion: l.sector || undefined },
    ...(hasGeo && { geo: { '@type': 'GeoCoordinates', latitude: l.latitude, longitude: l.longitude } }),
  }
}

// Escapa "<" para que un título con </script> no cierre la etiqueta.
export const serializeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c')
