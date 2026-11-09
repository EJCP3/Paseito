// Tipos compartidos cliente/servidor para listados y tours
import type {
  ListingType,
  ListingStatus,
  HotspotType,
  ListingMode,
  FurnishedStatus,
  PropertyCondition,
  AvailabilityStatus,
} from './enums'

// ============================================
// Modelos base
// ============================================

export interface User {
  id: string
  email: string
  name: string
  image?: string | null
  phone?: string | null
  verificationTier: number
  createdAt: string
}

export type ContactType = 'whatsapp' | 'instagram' | 'facebook' | 'tiktok' | 'website'

export interface ContactLink {
  type: ContactType
  value: string
}

export interface Photo {
  id: string
  url: string
  thumbUrl: string
  name: string | null
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

export interface NearbyPlace {
  id: string
  name: string
  category: string
  distanceM: number
  lat: number
  lng: number
  listingId: string
}

export interface AvailabilityRange {
  id: string
  listingId: string
  startDate: string
  endDate: string
  status: AvailabilityStatus
  createdAt: string
}

export interface Listing {
  id: string
  slug: string
  type: ListingType
  mode?: ListingMode | null
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
  latitude?: number | null
  longitude?: number | null

  // Comunes a apartamento/casa/villa
  furnished?: FurnishedStatus | null
  petsAllowed?: boolean | null
  condition?: PropertyCondition | null
  constructionYear?: number | null
  amenities?: string[]

  // Apartamento
  floorNumber?: number | null
  totalFloors?: number | null
  hasElevator?: boolean | null
  water24h?: boolean | null
  power24h?: boolean | null
  hasBalcony?: boolean | null
  maintenanceFee?: number | string | null

  // Casa
  floors?: number | null
  hasPatio?: boolean | null
  patioSize?: number | null
  hasPool?: boolean | null
  hasGarage?: boolean | null
  garageSpots?: number | null
  hasCistern?: boolean | null
  hasGenerator?: boolean | null
  landAreaM2?: number | null

  // Villa
  villaPoolType?: string | null
  villaPoolSize?: number | null
  guestCapacity?: number | null
  bedsCount?: number | null
  villaServices?: string[]
  pricePerDay?: number | string | null
  pricePerWeek?: number | string | null
  minNights?: number | null
  securityDeposit?: number | string | null
  cancellationPolicy?: string | null
  checkInTime?: string | null
  checkOutTime?: string | null

  // Redes/contactos que el anuncio muestra
  contacts?: ContactLink[] | null

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
  nearbyPlaces?: NearbyPlace[]
  availability?: AvailabilityRange[]
  owner: Pick<User, 'id' | 'name' | 'phone' | 'image' | 'verificationTier'> & { activeListingsCount: number }
}

// Respuesta de GET /api/users/[id]/profile — para SellerProfileModal
export interface SellerProfile {
  user: Pick<User, 'id' | 'name' | 'image' | 'verificationTier' | 'createdAt'>
  activeListings: (ListingWithPhotos & { scenes: Pick<Scene, 'previewUrl'>[] })[]
  totalSaved: number
}
