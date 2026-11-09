// Enums compartidos cliente/servidor
// Reflejan los enums de Prisma para uso en la UI

export enum ListingType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  VILLA = 'VILLA',
}

export enum ListingStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  PAUSED = 'PAUSED',
}

export enum HotspotType {
  LINK = 'LINK',
  INFO = 'INFO',
}

export enum ListingMode {
  SALE = 'SALE',
  RENT_LONG_TERM = 'RENT_LONG_TERM',
  RENT_DAILY = 'RENT_DAILY',
}

export enum FurnishedStatus {
  NONE = 'NONE',
  PARTIAL = 'PARTIAL',
  FULL = 'FULL',
}

export enum PropertyCondition {
  NEW = 'NEW',
  RENOVATED = 'RENOVATED',
  USED = 'USED',
  UNDER_CONSTRUCTION = 'UNDER_CONSTRUCTION',
}

export enum AvailabilityStatus {
  AVAILABLE = 'AVAILABLE',
  BLOCKED = 'BLOCKED',
  BOOKED = 'BOOKED',
}

// Labels para la UI (español)
export const ListingTypeLabels: Record<ListingType, string> = {
  [ListingType.APARTMENT]: 'Apartamento',
  [ListingType.HOUSE]: 'Casa',
  [ListingType.VILLA]: 'Villa',
}

export const ListingStatusLabels: Record<ListingStatus, string> = {
  [ListingStatus.DRAFT]: 'Borrador',
  [ListingStatus.ACTIVE]: 'Activo',
  [ListingStatus.SOLD]: 'Vendido',
  [ListingStatus.PAUSED]: 'Pausado',
}

export const HotspotTypeLabels: Record<HotspotType, string> = {
  [HotspotType.LINK]: 'Enlace a escena',
  [HotspotType.INFO]: 'Información',
}

export const ListingModeLabels: Record<ListingMode, string> = {
  [ListingMode.SALE]: 'Venta',
  [ListingMode.RENT_LONG_TERM]: 'Alquiler',
  [ListingMode.RENT_DAILY]: 'Alquiler por día',
}

export const FurnishedStatusLabels: Record<FurnishedStatus, string> = {
  [FurnishedStatus.NONE]: 'Sin amueblar',
  [FurnishedStatus.PARTIAL]: 'Parcialmente amueblado',
  [FurnishedStatus.FULL]: 'Completamente amueblado',
}

export const PropertyConditionLabels: Record<PropertyCondition, string> = {
  [PropertyCondition.NEW]: 'Nuevo',
  [PropertyCondition.RENOVATED]: 'Remodelado',
  [PropertyCondition.USED]: 'Usado',
  [PropertyCondition.UNDER_CONSTRUCTION]: 'A estrenar',
}

export const AvailabilityStatusLabels: Record<AvailabilityStatus, string> = {
  [AvailabilityStatus.AVAILABLE]: 'Disponible',
  [AvailabilityStatus.BLOCKED]: 'Bloqueado',
  [AvailabilityStatus.BOOKED]: 'Ocupado',
}

// Amenidades de edificio/condominio (multi-select) — mismo vocabulario en el
// form de publicar y en el badge de características del detalle.
export const BUILDING_AMENITIES = [
  'Seguridad 24h',
  'Área social',
  'Gimnasio',
  'Piscina del condominio',
  'Ascensor de servicio',
  'Área de niños',
  'Salón de eventos',
  'Cancha deportiva',
] as const

// Servicios incluidos en el alquiler de una villa (multi-select)
export const VILLA_SERVICES = [
  'Wifi',
  'Aire acondicionado',
  'Cocina equipada',
  'Servicio de limpieza',
  'Chef',
  'Ropa de cama',
] as const

// Nombres de íconos (ver app/assets/icons/index.ts) para cada tipo de listado
export const ListingTypeIcons: Record<ListingType, string> = {
  [ListingType.APARTMENT]: 'building',
  [ListingType.HOUSE]: 'home',
  [ListingType.VILLA]: 'villa',
}
