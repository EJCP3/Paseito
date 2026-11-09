// Schemas de validación Zod — Listados
// Un schema base compartido por apartamento/casa/villa + un schema discriminado
// por `type` para las validaciones y campos propios de cada uno.
import { z } from 'zod'

import { ContactsArraySchema } from './contact.schema'
import locations from '../data/rd-locations.json'
import { BUILDING_AMENITIES, VILLA_SERVICES } from '../types/enums'

// Enums como Zod
export const ListingTypeSchema = z.enum(['APARTMENT', 'HOUSE', 'VILLA'])
export const ListingStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'SOLD', 'PAUSED', 'PENDING_REVIEW'])
export const ListingModeSchema = z.enum(['SALE', 'RENT_LONG_TERM', 'RENT_DAILY'])
export const FurnishedStatusSchema = z.enum(['NONE', 'PARTIAL', 'FULL'])
export const PropertyConditionSchema = z.enum(['NEW', 'RENOVATED', 'USED', 'UNDER_CONSTRUCTION'])

// Ciudad/sector deben existir en el dataset de RD (misma lista que usa el
// combobox del front) — nadie puede mandar un valor inventado llamando el
// endpoint directo.
function checkLocation(data: { city?: string; sector?: string }, ctx: z.RefinementCtx) {
  if (!data.city) return
  const entry = locations.find((l) => l.city === data.city)
  if (!entry) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Selecciona una ciudad válida de la lista.', path: ['city'] })
  } else if (data.sector && !entry.sectors.includes(data.sector)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ese sector no pertenece a la ciudad seleccionada.', path: ['sector'] })
  }
}

// Lat/lng siempre van de la mano (ambos o ninguno)
function checkCoordinates(data: { latitude?: number; longitude?: number }, ctx: z.RefinementCtx) {
  if ((data.latitude === undefined) !== (data.longitude === undefined)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Faltan coordenadas: confirma la ubicación en el mapa', path: ['latitude'] })
  }
}

// ============================================
// Schema base — compartido por apartamento/casa/villa
// ============================================
export const listingBaseSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(120),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres').max(5000),
  currency: z.string().default('USD'),

  city: z.string().max(100),
  sector: z.string().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),

  areaM2: z.number().positive().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().min(0).optional(), // admite medios baños (ej. 2.5)
  parking: z.number().int().min(0).optional(),

  furnished: FurnishedStatusSchema.optional(),
  petsAllowed: z.boolean().optional(),
  condition: PropertyConditionSchema.optional(),
  constructionYear: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  amenities: z.array(z.enum(BUILDING_AMENITIES)).max(BUILDING_AMENITIES.length).default([]),

  contacts: ContactsArraySchema.optional(),
})

// ============================================
// Apartamento
// ============================================
export const apartmentSchema = listingBaseSchema.extend({
  type: z.literal('APARTMENT'),
  mode: ListingModeSchema.exclude(['RENT_DAILY']),
  price: z.number().positive('El precio debe ser mayor a 0'),

  floorNumber: z.number().int().optional(),
  totalFloors: z.number().int().positive().optional(),
  hasElevator: z.boolean().optional(),
  water24h: z.boolean().optional(),
  power24h: z.boolean().optional(),
  hasBalcony: z.boolean().optional(),
  maintenanceFee: z.number().min(0).optional(),
})

// ============================================
// Casa
// ============================================
export const houseSchema = listingBaseSchema.extend({
  type: z.literal('HOUSE'),
  mode: ListingModeSchema.exclude(['RENT_DAILY']),
  price: z.number().positive('El precio debe ser mayor a 0'),

  floors: z.number().int().positive().optional(),
  hasPatio: z.boolean().optional(),
  patioSize: z.number().positive().optional(),
  hasPool: z.boolean().optional(),
  hasGarage: z.boolean().optional(),
  garageSpots: z.number().int().min(0).optional(),
  hasCistern: z.boolean().optional(),
  hasGenerator: z.boolean().optional(),
  landAreaM2: z.number().positive().optional(),
})

// ============================================
// Villa — siempre alquiler por día (turístico), sin selector de modalidad
// ============================================
export const villaSchema = listingBaseSchema.extend({
  type: z.literal('VILLA'),
  price: z.number().positive('El precio debe ser mayor a 0'),

  villaPoolType: z.enum(['privada', 'compartida']).optional(),
  villaPoolSize: z.number().positive().optional(),
  guestCapacity: z.number().int().positive().optional(),
  bedsCount: z.number().int().positive().optional(),
  villaServices: z.array(z.enum(VILLA_SERVICES)).max(VILLA_SERVICES.length).default([]),
  pricePerDay: z.number().positive('El precio por día es requerido'),
  pricePerWeek: z.number().positive().optional(),
  minNights: z.number().int().positive().optional(),
  securityDeposit: z.number().min(0).optional(),
  cancellationPolicy: z.enum(['flexible', 'moderada', 'estricta']).optional(),
  checkInTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato de hora inválido (HH:MM)').optional(),
  checkOutTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato de hora inválido (HH:MM)').optional(),
})

// ============================================
// Unión discriminada por `type` + validaciones cruzadas
// ============================================
export const CreateListingSchema = z
  .discriminatedUnion('type', [apartmentSchema, houseSchema, villaSchema])
  .superRefine((data, ctx) => {
    checkLocation(data, ctx)
    checkCoordinates(data, ctx)
  })

export type CreateListingInput = z.infer<typeof CreateListingSchema>

// Schema para actualizar un listado (todos los campos son opcionales, el
// `type` de un anuncio no se cambia después de creado). `null` borra un campo opcional.
export const UpdateListingSchema = z.object({
  title: z.string().min(5).max(120).optional(),
  description: z.string().min(20).max(5000).optional(),
  price: z.number().positive().optional(),
  currency: z.string().optional(),
  mode: ListingModeSchema.optional(),
  areaM2: z.number().positive().nullable().optional(),
  bedrooms: z.number().int().min(0).nullable().optional(),
  bathrooms: z.number().min(0).nullable().optional(), // admite medios baños (ej. 2.5)
  parking: z.number().int().min(0).nullable().optional(),
  sector: z.string().max(100).nullable().optional(),
  city: z.string().max(100).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),

  furnished: FurnishedStatusSchema.nullable().optional(),
  petsAllowed: z.boolean().nullable().optional(),
  condition: PropertyConditionSchema.nullable().optional(),
  constructionYear: z.number().int().min(1900).nullable().optional(),
  amenities: z.array(z.enum(BUILDING_AMENITIES)).optional(),
  contacts: ContactsArraySchema.optional(),

  floorNumber: z.number().int().nullable().optional(),
  totalFloors: z.number().int().positive().nullable().optional(),
  hasElevator: z.boolean().nullable().optional(),
  water24h: z.boolean().nullable().optional(),
  power24h: z.boolean().nullable().optional(),
  hasBalcony: z.boolean().nullable().optional(),
  maintenanceFee: z.number().min(0).nullable().optional(),

  floors: z.number().int().positive().nullable().optional(),
  hasPatio: z.boolean().nullable().optional(),
  patioSize: z.number().positive().nullable().optional(),
  hasPool: z.boolean().nullable().optional(),
  hasGarage: z.boolean().nullable().optional(),
  garageSpots: z.number().int().min(0).nullable().optional(),
  hasCistern: z.boolean().nullable().optional(),
  hasGenerator: z.boolean().nullable().optional(),
  landAreaM2: z.number().positive().nullable().optional(),

  villaPoolType: z.enum(['privada', 'compartida']).nullable().optional(),
  villaPoolSize: z.number().positive().nullable().optional(),
  guestCapacity: z.number().int().positive().nullable().optional(),
  bedsCount: z.number().int().positive().nullable().optional(),
  villaServices: z.array(z.enum(VILLA_SERVICES)).optional(),
  pricePerDay: z.number().positive().nullable().optional(),
  pricePerWeek: z.number().positive().nullable().optional(),
  minNights: z.number().int().positive().nullable().optional(),
  securityDeposit: z.number().min(0).nullable().optional(),
  cancellationPolicy: z.enum(['flexible', 'moderada', 'estricta']).nullable().optional(),
  checkInTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  checkOutTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
})

// Schema para filtros de búsqueda
export const ListingFiltersSchema = z.object({
  type: ListingTypeSchema.optional(),
  mode: ListingModeSchema.optional(),
  city: z.string().optional(),
  sector: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  minBedrooms: z.number().int().min(0).optional(),
  minBathrooms: z.number().min(0).optional(),
  minArea: z.number().min(0).optional(),
  maxArea: z.number().min(0).optional(),
  search: z.string().max(200).optional(),
  sort: z.enum(['recent', 'price_asc', 'price_desc']).optional(),
  excludeId: z.string().optional(), // Para "otros anuncios" (nunca el actual)
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(48).default(12),
})

export type UpdateListingInput = z.infer<typeof UpdateListingSchema>
export type ListingFiltersInput = z.infer<typeof ListingFiltersSchema>
