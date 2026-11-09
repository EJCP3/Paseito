// Validación real de imagen con Sharp (no confía en extensión ni Content-Type)
export type ImageKind = 'photo' | 'panorama'
export type ImageCheck =
  | { ok: true; width: number; height: number; format: string }
  | { ok: false; status: 415 | 422; message: string }

const FORMATS = ['jpeg', 'png', 'webp']

export async function checkImage(buf: Buffer, kind: ImageKind): Promise<ImageCheck> {
  let meta
  try {
    const sharp = (await import('sharp')).default
    meta = await sharp(buf).metadata()
  } catch {
    return { ok: false, status: 415, message: 'El archivo no es una imagen válida' }
  }
  const { format, width, height } = meta
  if (!format || !FORMATS.includes(format) || !width || !height) {
    return { ok: false, status: 415, message: 'Formato no permitido: usa JPG, PNG o WebP' }
  }
  if (width > 16384 || height > 16384) {
    return { ok: false, status: 422, message: 'La imagen es demasiado grande (máximo 16384 px por lado)' }
  }
  if (kind === 'panorama') {
    if (width > 8192 || height > 4096) {
      return { ok: false, status: 422, message: 'La panorámica es demasiado grande (máximo 8192×4096 px)' }
    }
    const ratio = width / height
    if (ratio < 1.8 || ratio > 2.2) {
      return { ok: false, status: 422, message: 'La panorámica debe tener proporción 2:1 (entre 1.8 y 2.2)' }
    }
    if (width < 4000 || height < 2000) {
      return { ok: false, status: 422, message: 'La panorámica debe medir al menos 4000×2000 px' }
    }
  }
  return { ok: true, width, height, format }
}
