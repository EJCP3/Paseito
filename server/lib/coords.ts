// Coordenadas aproximadas (3 decimales, ~110 m) para quien no es el dueño
type WithCoords = { ownerId?: string | null; latitude?: number | null; longitude?: number | null }

const round3 = <T extends number | null | undefined>(n: T) =>
  (typeof n === 'number' ? Math.round(n * 1000) / 1000 : n) as T

export function publicCoords<T extends WithCoords>(listing: T, viewerId?: string | null): T {
  if (viewerId && listing.ownerId === viewerId) return { ...listing }
  return { ...listing, latitude: round3(listing.latitude), longitude: round3(listing.longitude) }
}

// Distancia a POIs redondeada a 100 m: con la distancia exacta a varios POIs conocidos se triangularía la casa
export function publicNearby<T extends { distanceM?: number | null }>(places: T[] | undefined | null) {
  return places?.map((p) => (typeof p.distanceM === 'number' ? { ...p, distanceM: Math.round(p.distanceM / 100) * 100 } : p))
}
