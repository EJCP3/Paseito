// Tipos compartidos cliente/servidor para listados y tours
import type { ListingType, ListingStatus, HotspotType } from './enums'

// ============================================
// Modelos base
// ============================================

export interface User {
  id: string
  email: string
  name: string
  phone?: string | null
  createdAt: string
}

export interface Photo {
  id: string
  url: string
  thumbUrl: string
  order: number
}

export interface Hotspot {
  id: string
  type: HotspotType
  yaw: number
  pitch: number
  title?: string | null
  text?: string | null
  targetSceneId?: string | null
  sceneId: string
}

export interface Scene {
  id: string
  name: string
  panoramaUrl: string
  previewUrl: string
  order: number
  initialYaw: number
  listingId: string
}

export interface Listing {
  id: string
  slug: string
  type: ListingType
  title: string
  description: string
  price: number | string
  currency: string
  status: ListingStatus

  // Inmueble
  areaM2?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  parking?: number | null
  sector?: string | null
  city?: string | null

  // Vehículo
  brand?: string | null
  model?: string | null
  year?: number | null
  mileageKm?: number | null

  ownerId: string
  createdAt: string
  updatedAt: string
}

// ============================================
// Tipos compuestos (con relaciones)
// ============================================

export interface SceneWithHotspots extends Scene {
  hotspots: Hotspot[]
}

export interface ListingWithPhotos extends Listing {
  photos: Photo[]
}

export interface ListingWithScenes extends Listing {
  scenes: SceneWithHotspots[]
}

export interface ListingFull extends Listing {
  photos: Photo[]
  scenes: SceneWithHotspots[]
  owner: Pick<User, 'id' | 'name' | 'phone'>
}

// ============================================
// DTOs para API
// ============================================

export interface ListingCreateInput {
  type: ListingType
  title: string
  description: string
  price: number
  currency?: string
  areaM2?: number
  bedrooms?: number
  bathrooms?: number
  parking?: number
  sector?: string
  city?: string
  brand?: string
  model?: string
  year?: number
  mileageKm?: number
}

export interface ListingUpdateInput extends Partial<ListingCreateInput> {
  status?: ListingStatus
}

export interface ListingFilters {
  type?: ListingType
  status?: ListingStatus
  city?: string
  sector?: string
  minPrice?: number
  maxPrice?: number
  minBedrooms?: number
  search?: string
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
