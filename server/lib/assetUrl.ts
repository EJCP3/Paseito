// ¿Es esta URL un asset de Cloudinary propio dentro de la carpeta de este anuncio?
export function isListingAssetUrl(url: string, cloudName: string, listingId: string): boolean {
  if (!url || !cloudName || !listingId) return false
  // Sin traversal ni barras/puntos codificados (el parser de URL normalizaría %2e%2e)
  if (/\.\.|%2e|%2f|%5c|\\/i.test(url)) return false

  let u: URL
  try {
    u = new URL(url)
  } catch {
    return false
  }
  if (u.protocol !== 'https:' || u.hostname !== 'res.cloudinary.com' || u.port || u.username || u.password) return false

  const prefix = `/${cloudName}/image/upload/`
  if (!u.pathname.startsWith(prefix)) return false

  // Tras /upload/ pueden ir transformaciones y versión antes de la carpeta
  const rest = u.pathname.slice(prefix.length)
  const marker = `paseito/listings/${listingId}/`
  const idx = rest.indexOf(marker)
  if (idx < 0 || (idx !== 0 && rest[idx - 1] !== '/')) return false
  return rest.length > idx + marker.length && !rest.endsWith('/')
}
