// Enums compartidos cliente/servidor
// Reflejan los enums de Prisma para uso en la UI

export enum ListingType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  VILLA = 'VILLA',
  VEHICLE = 'VEHICLE',
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

// Labels para la UI (español)
export const ListingTypeLabels: Record<ListingType, string> = {
  [ListingType.APARTMENT]: 'Apartamento',
  [ListingType.HOUSE]: 'Casa',
  [ListingType.VILLA]: 'Villa',
  [ListingType.VEHICLE]: 'Vehículo',
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

// Nombres de íconos (ver app/assets/icons/index.ts) para cada tipo de listado
export const ListingTypeIcons: Record<ListingType, string> = {
  [ListingType.APARTMENT]: 'building',
  [ListingType.HOUSE]: 'home',
  [ListingType.VILLA]: 'villa',
  [ListingType.VEHICLE]: 'car',
}
