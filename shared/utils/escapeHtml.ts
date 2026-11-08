// Escapa texto de usuario antes de meterlo en HTML (PSV tooltips, html:)
const MAP: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export function escapeHtml(value: string | null | undefined): string {
  return value ? value.replace(/[&<>"']/g, (c) => MAP[c]!) : ''
}
