// Metadatos de presentación (ícono + etiqueta) por categoría de NearbyPlace.
// Única fuente de verdad para el publish flow y el panel de detalle del listado.
export const NEARBY_PLACE_CATEGORY_META: Record<string, { icon: string; label: string }> = {
  supermarket: { icon: 'shoppingCart', label: 'Supermercado' },
  store: { icon: 'buildingStore', label: 'Colmado / Tienda' },
  pharmacy: { icon: 'medicalCross', label: 'Farmacia' },
  school: { icon: 'school', label: 'Escuela' },
  transit: { icon: 'bus', label: 'Transporte público' },
  bank: { icon: 'buildingBank', label: 'Banco' },
}
