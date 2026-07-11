// Schemas de validación Zod — Tours y escenas 360°
import { z } from 'zod'

export const HotspotTypeSchema = z.enum(['LINK', 'INFO'])

// Schema para crear una escena
export const CreateSceneSchema = z.object({
  name: z.string().min(1, 'El nombre de la escena es requerido').max(80),
  panoramaUrl: z.string().url('URL de panorámica inválida'),
  previewUrl: z.string().url('URL de preview inválida'),
  order: z.number().int().min(0),
  initialYaw: z.number().default(0),
  listingId: z.string().min(1),
})

// Schema para crear/actualizar un hotspot
export const HotspotSchema = z.object({
  id: z.string().optional(), // Presente al actualizar
  type: HotspotTypeSchema,
  yaw: z.number().min(-Math.PI).max(Math.PI),
  pitch: z.number().min(-Math.PI / 2).max(Math.PI / 2),
  title: z.string().max(100).optional(),
  text: z.string().max(500).optional(),
  targetSceneId: z.string().optional(),
}).superRefine((data, ctx) => {
  // Si es un enlace, requiere escena destino
  if (data.type === 'LINK' && !data.targetSceneId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Un hotspot de tipo enlace requiere una escena destino',
      path: ['targetSceneId'],
    })
  }

  // Si es info, requiere título o texto
  if (data.type === 'INFO' && !data.title && !data.text) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Un hotspot de información requiere título o texto',
      path: ['title'],
    })
  }
})

// Schema para actualizar todos los hotspots de una escena
export const UpdateHotspotsSchema = z.object({
  sceneId: z.string().min(1),
  hotspots: z.array(HotspotSchema),
})

// Schema para solicitar URL de subida firmada
export const UploadUrlRequestSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().regex(/^image\/(jpeg|png|webp|tiff)$/, 'Tipo de archivo no soportado'),
  listingId: z.string().min(1),
})

// Tipos inferidos
export type CreateSceneInput = z.infer<typeof CreateSceneSchema>
export type HotspotInput = z.infer<typeof HotspotSchema>
export type UpdateHotspotsInput = z.infer<typeof UpdateHotspotsSchema>
export type UploadUrlRequest = z.infer<typeof UploadUrlRequestSchema>
