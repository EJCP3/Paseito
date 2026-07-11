// Composable — useUpload
// Flujo de subida: validación client-side, URL firmada, PUT a R2
export function useUpload() {
  const uploading = ref(false)
  const progress = ref(0)
  const error = ref<string | null>(null)

  /**
   * Valida la proporción de una imagen panorámica en el cliente (rápida)
   * @param file Archivo de imagen
   * @returns true si la proporción es ~2:1
   */
  async function validatePanoramaClient(file: File): Promise<{ valid: boolean; ratio: number }> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const ratio = img.width / img.height
        const valid = ratio >= 1.8 && ratio <= 2.2
        URL.revokeObjectURL(img.src)
        resolve({ valid, ratio })
      }
      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        resolve({ valid: false, ratio: 0 })
      }
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Sube una panorámica al storage vía URL firmada
   * Flujo: validar → obtener URL firmada → PUT a R2
   */
  async function uploadPanorama(file: File, listingId: string): Promise<{
    publicUrl: string
  } | null> {
    uploading.value = true
    progress.value = 0
    error.value = null

    try {
      // 1. Validar en cliente
      const { valid, ratio } = await validatePanoramaClient(file)
      if (!valid) {
        error.value = `La imagen no tiene proporción panorámica (2:1). Proporción actual: ${ratio.toFixed(2)}:1`
        return null
      }
      progress.value = 20

      // 2. Solicitar URL firmada
      const { uploadUrl, publicUrl } = await $fetch('/api/tours/upload-url', {
        method: 'POST',
        body: {
          fileName: file.name,
          contentType: file.type,
          listingId,
        },
      })
      progress.value = 40

      // 3. Subir directo a R2 (si hay URL de subida)
      if (uploadUrl) {
        await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        })
      }
      progress.value = 100

      return { publicUrl }
    } catch (err: any) {
      error.value = err.message || 'Error al subir la imagen'
      return null
    } finally {
      uploading.value = false
    }
  }

  return {
    uploading,
    progress,
    error,
    validatePanoramaClient,
    uploadPanorama,
  }
}
