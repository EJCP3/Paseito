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

// Schema para renombrar una escena
export const UpdateSceneSchema = z.object({
  name: z.string().min(1, 'El nombre de la escena es requerido').max(80),
})

// Schema para crear/actualizar un hotspot
export const HotspotSchema = z.object({
  id: z.string().optional(), // Presente al actualizar
  type: HotspotTypeSchema,
  // Photo Sphere Viewer entrega el yaw normalizado a [0, 2π) al hacer clic en la
  // esfera; aceptamos [-2π, 2π] para no rechazar clics de la "mitad de atrás"
  // (cualquier valor renderiza igual, PSV lo re-normaliza al posicionar).
  yaw: z.number().min(-2 * Math.PI).max(2 * Math.PI),
  pitch: z.number().min(-Math.PI / 2).max(Math.PI / 2),
  // nullish (no optional): tanto la BD como el cliente mandan `null` en los
  // campos vacíos; `.optional()` rechazaba el null y hacía fallar el guardado.
  title: z.string().max(100).nullish(),
  text: z.string().max(500).nullish(),
  targetSceneId: z.string().nullish(),
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
  hotspots: z.array(HotspotSchema).max(50, 'Máximo 50 hotspots por escena'),
})

// Tipos inferidos
export type CreateSceneInput = z.infer<typeof CreateSceneSchema>
export type UpdateSceneInput = z.infer<typeof UpdateSceneSchema>
export type HotspotInput = z.infer<typeof HotspotSchema>
export type UpdateHotspotsInput = z.infer<typeof UpdateHotspotsSchema>
