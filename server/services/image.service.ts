// Service — Image processing
// Validación de dimensiones y generación de thumbnails con Sharp
// TODO: Integrar con el flujo de subida real

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
