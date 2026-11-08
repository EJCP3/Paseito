// Composable — useUpload
// Flujo de subida: validación client-side + subida a Cloudinary vía /api/uploads
export function useUpload() {
  const uploading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Valida la proporción de una imagen panorámica en el cliente (rápida)
   * @param file Archivo de imagen
   * @returns true si la proporción es ~2:1
   */
  async function validatePanoramaClient(file: File): Promise<{ valid: boolean; ratio: number; width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const ratio = img.width / img.height
        const valid = ratio >= 1.8 && ratio <= 2.2
        const { width, height } = img
        URL.revokeObjectURL(img.src)
        resolve({ valid, ratio, width, height })
      }
      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        resolve({ valid: false, ratio: 0, width: 0, height: 0 })
      }
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Sube una imagen a Cloudinary a través de nuestro servidor
   */
  async function uploadImage(file: File, listingId: string, kind: 'photo' | 'panorama' = 'photo'): Promise<{ url: string; thumbUrl: string } | null> {
    uploading.value = true
    error.value = null

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('listingId', listingId)
      form.append('kind', kind)

      return await $fetch<{ url: string; thumbUrl: string }>('/api/uploads', {
        method: 'POST',
        body: form,
      })
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Error al subir la imagen'
      return null
    } finally {
      uploading.value = false
    }
  }

  return {
    uploading,
    error,
    validatePanoramaClient,
    uploadImage,
  }
}
