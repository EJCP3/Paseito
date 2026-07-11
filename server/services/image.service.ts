// Service — Image processing
// Validación de dimensiones y generación de thumbnails con Sharp
// TODO: Integrar con el flujo de subida real

/**
 * Valida que una imagen sea panorámica (ratio ~2:1)
 * @param imagePath Ruta local o buffer de la imagen
 * @returns Metadata de la imagen validada
 */
export async function validatePanorama(imageBuffer: Buffer): Promise<{
  width: number
  height: number
  ratio: number
  isValid: boolean
}> {
  // Importar sharp dinámicamente para evitar problemas en client bundle
  const sharp = (await import('sharp')).default

  const metadata = await sharp(imageBuffer).metadata()
  const width = metadata.width || 0
  const height = metadata.height || 0
  const ratio = width / height

  // Proporción aceptable para panorámicas: entre 1.8:1 y 2.2:1
  const isValid = ratio >= 1.8 && ratio <= 2.2

  return { width, height, ratio, isValid }
}

/**
 * Genera un thumbnail WebP de una panorámica
 * @param imageBuffer Buffer de la imagen original
 * @param width Ancho del thumbnail (default: 400px)
 * @returns Buffer del thumbnail en WebP
 */
export async function generateThumbnail(
  imageBuffer: Buffer,
  width: number = 400
): Promise<Buffer> {
  const sharp = (await import('sharp')).default

  return sharp(imageBuffer)
    .resize(width, Math.round(width / 2), { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer()
}

/**
 * Genera un preview WebP de una panorámica para la galería
 * @param imageBuffer Buffer de la imagen original
 * @returns Buffer del preview en WebP
 */
export async function generatePreview(
  imageBuffer: Buffer,
  width: number = 800
): Promise<Buffer> {
  const sharp = (await import('sharp')).default

  return sharp(imageBuffer)
    .resize(width, Math.round(width / 2), { fit: 'cover' })
    .webp({ quality: 75 })
    .toBuffer()
}
