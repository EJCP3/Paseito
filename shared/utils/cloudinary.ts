// Inserta una transformación tras /upload/ solo en URLs de Cloudinary.
// Reemplaza la transformación existente (segmento sin "v123" ni carpeta) → idempotente.
const RE = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)((?:[a-z]{1,3}_[^/]*\/)*)(.*)$/

export function cld(url: string | null | undefined, transform: string): string {
  if (!url) return ''
  const m = RE.exec(url)
  return m ? `${m[1]}${transform}/${m[3]}` : url
}
