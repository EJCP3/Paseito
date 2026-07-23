// Service — Storage (Cloudinary)
// Subida firmada vía su API REST directa (fetch + crypto nativo, sin SDK)
import { createHash } from 'node:crypto'

function signParams(params: Record<string, string | number>, apiSecret: string) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')
  return createHash('sha1').update(toSign + apiSecret).digest('hex')
}

/**
 * Sube una imagen a Cloudinary y devuelve la URL completa + una miniatura recortada
 */
export async function uploadImage(file: Buffer, folder: string): Promise<{ url: string; thumbUrl: string }> {
  const config = useRuntimeConfig()
  if (!config.cloudName || !config.cloudApiKey || !config.cloudApiSecret) {
    throw createError({ statusCode: 501, statusMessage: 'Cloudinary no configurado. Agrega las credenciales en .env' })
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const signature = signParams({ folder, timestamp }, config.cloudApiSecret)

  const form = new FormData()
  form.append('file', new Blob([file]))
  form.append('api_key', config.cloudApiKey)
  form.append('timestamp', String(timestamp))
  form.append('folder', folder)
  form.append('signature', signature)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    console.error('[Storage] Error subiendo a Cloudinary:', res.status, await res.text())
    throw createError({ statusCode: 502, statusMessage: 'Error al subir la imagen' })
  }

  const data = await res.json() as { secure_url: string }
  return {
    url: data.secure_url,
    thumbUrl: data.secure_url.replace('/upload/', '/upload/w_500,h_500,c_fill,q_auto,f_auto/'),
  }
}

/**
 * Elimina una imagen de Cloudinary a partir de su URL (best-effort:
 * si falla, solo se loguea — el borrado en BD no debe bloquearse por esto).
 */
export async function deleteImage(url: string): Promise<void> {
  const config = useRuntimeConfig()
  if (!config.cloudName || !config.cloudApiKey || !config.cloudApiSecret) return

  // public_id = ruta tras /upload/vNNN/, sin extensión
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i)
  if (!m) return

  const publicId = decodeURIComponent(m[1])
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = signParams({ public_id: publicId, timestamp }, config.cloudApiSecret)

  const form = new FormData()
  form.append('public_id', publicId)
  form.append('api_key', config.cloudApiKey)
  form.append('timestamp', String(timestamp))
  form.append('signature', signature)

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`, {
      method: 'POST',
      body: form,
    })
    if (!res.ok) console.error('[Storage] Error borrando de Cloudinary:', res.status, await res.text())
  } catch (err) {
    console.error('[Storage] Error borrando de Cloudinary:', err)
  }
}
