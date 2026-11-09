// Precios de destacados (centavos USD). Editar aquí: es el único sitio.
export type FeaturePlacementKey = 'HERO' | 'SIDEBAR' | 'BADGE'
export type FeaturePlanKey = '7d' | '30d'

export const FEATURE_PLANS: Record<FeaturePlanKey, { days: number; prices: Record<FeaturePlacementKey, number> }> = {
  '7d': { days: 7, prices: { HERO: 1500, SIDEBAR: 800, BADGE: 500 } },
  '30d': { days: 30, prices: { HERO: 5000, SIDEBAR: 2500, BADGE: 1500 } },
}

export const PLACEMENT_LABELS: Record<FeaturePlacementKey, string> = {
  HERO: 'Hero de la portada',
  SIDEBAR: 'Rail "Más anuncios"',
  BADGE: 'Insignia en tarjetas',
}

export const PLACEMENT_HINTS: Record<FeaturePlacementKey, string> = {
  HERO: 'Una de las 8 imágenes grandes de la portada.',
  SIDEBAR: 'Apareces primero en "Más anuncios" y con etiqueta.',
  BADGE: 'Etiqueta "Destacado" y prioridad en /buscar.',
}

// Los marcadores entre corchetes los rellena el dueño del sitio con sus datos reales.
export const PAYMENT_INSTRUCTIONS =
  'Realiza una transferencia por el importe indicado a:\nBanco: [BANCO]\nCuenta: [CUENTA]\nTitular: [TITULAR]\n' +
  'Escribe la referencia en el concepto y envía el comprobante por WhatsApp a [WHATSAPP DE PAGOS]. ' +
  'Activaremos tu destacado en cuanto confirmemos el pago.'

// Referencia corta que el vendedor escribe en el pago: primeros 8 caracteres del id
export const featureRef = (id: string) => id.slice(0, 8).toUpperCase()

const RD_TZ = 'America/Santo_Domingo'
export const formatUsd = (cents: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD' }).format(cents / 100)
// Fechas siempre en hora de República Dominicana, sin importar dónde se renderice
export const formatRD = (d: string | Date, withTime = false) =>
  new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'short', ...(withTime && { hour: 'numeric', minute: '2-digit' }), timeZone: RD_TZ }).format(new Date(d))
