// Schemas de validación Zod — Listados
import { z } from 'zod'

// Enums como Zod
export const ListingTypeSchema = z.enum(['APARTMENT', 'HOUSE', 'VEHICLE'])
export const ListingStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'SOLD', 'PAUSED'])

// Schema base para crear un listado
export const CreateListingSchema = z.object({
  type: ListingTypeSchema,
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(120),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres').max(5000),
  price: z.number().positive('El precio debe ser mayor a 0'),
  currency: z.string().default('USD'),

  // Campos de inmueble (opcionales, requeridos según tipo)
  areaM2: z.number().positive().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  parking: z.number().int().min(0).optional(),
  sector: z.string().max(100).optional(),
  city: z.string().max(100).optional(),

  // Campos de vehículo (opcionales, requeridos según tipo)
  brand: z.string().max(50).optional(),
  model: z.string().max(50).optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  mileageKm: z.number().int().min(0).optional(),
}).superRefine((data, ctx) => {
  // Validaciones condicionales según el tipo
  if (data.type === 'APARTMENT' || data.type === 'HOUSE') {
    if (!data.city) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La ciudad es requerida para inmuebles',
        path: ['city'],
      })
    }
  }

  if (data.type === 'VEHICLE') {
    if (!data.brand) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La marca es requerida para vehículos',
        path: ['brand'],
      })
    }
    if (!data.model) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El modelo es requerido para vehículos',
        path: ['model'],
      })
    }
    if (!data.year) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El año es requerido para vehículos',
        path: ['year'],
      })
    }
  }
})

// Schema para actualizar un listado (todos los campos son opcionales)
export const UpdateListingSchema = z.object({
  type: ListingTypeSchema.optional(),
  title: z.string().min(5).max(120).optional(),
  description: z.string().min(20).max(5000).optional(),
  price: z.number().positive().optional(),
  currency: z.string().optional(),
  status: ListingStatusSchema.optional(),
  areaM2: z.number().positive().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  parking: z.number().int().min(0).optional(),
  sector: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  brand: z.string().max(50).optional(),
  model: z.string().max(50).optional(),
  year: z.number().int().min(1900).optional(),
  mileageKm: z.number().int().min(0).optional(),
})

// Schema para filtros de búsqueda
export const ListingFiltersSchema = z.object({
  type: ListingTypeSchema.optional(),
  status: ListingStatusSchema.optional(),
  city: z.string().optional(),
  sector: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  minBedrooms: z.number().int().min(0).optional(),
  search: z.string().max(200).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(12),
})

// Tipos inferidos
export type CreateListingInput = z.infer<typeof CreateListingSchema>
export type UpdateListingInput = z.infer<typeof UpdateListingSchema>
export type ListingFiltersInput = z.infer<typeof ListingFiltersSchema>
