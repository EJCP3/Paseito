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
  PENDING_REVIEW = 'PENDING_REVIEW',
}

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum ReportReason {
  SPAM = 'SPAM',
  FRAUD = 'FRAUD',
  INAPPROPRIATE = 'INAPPROPRIATE',
  MISLEADING_PRICE = 'MISLEADING_PRICE',
  OTHER = 'OTHER',
}

export enum ListingEventType {
  VIEW = 'VIEW',
  CONTACT_CLICK = 'CONTACT_CLICK',
  SCHEDULE_CLICK = 'SCHEDULE_CLICK',
  TOUR_OPEN = 'TOUR_OPEN',
  TOUR_TIME = 'TOUR_TIME',
}

export enum FeaturePlacement {
  HERO = 'HERO',
  SIDEBAR = 'SIDEBAR',
  BADGE = 'BADGE',
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
  [ListingStatus.PENDING_REVIEW]: 'En revisión',
}

export const RoleLabels: Record<Role, string> = {
  [Role.USER]: 'Usuario',
  [Role.ADMIN]: 'Administrador',
}

export const ReportReasonLabels: Record<ReportReason, string> = {
  [ReportReason.SPAM]: 'Spam',
  [ReportReason.FRAUD]: 'Posible fraude',
  [ReportReason.INAPPROPRIATE]: 'Contenido inapropiado',
  [ReportReason.MISLEADING_PRICE]: 'Precio engañoso',
  [ReportReason.OTHER]: 'Otro',
}

export const ListingEventTypeLabels: Record<ListingEventType, string> = {
  [ListingEventType.VIEW]: 'Vista',
  [ListingEventType.CONTACT_CLICK]: 'Clic en contacto',
  [ListingEventType.SCHEDULE_CLICK]: 'Clic en agendar visita',
  [ListingEventType.TOUR_OPEN]: 'Tour abierto',
  [ListingEventType.TOUR_TIME]: 'Tiempo en el tour',
}

export const FeaturePlacementLabels: Record<FeaturePlacement, string> = {
  [FeaturePlacement.HERO]: 'Portada',
  [FeaturePlacement.SIDEBAR]: 'Barra lateral',
  [FeaturePlacement.BADGE]: 'Insignia',
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
