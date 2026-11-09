// Reglas puras de moderación (sin Nuxt ni Prisma, testeable)
type Fail = { ok: false; reason: string }

export function adminListingAction(
  listing: { status: string; deletedAt: Date | null; adminPausedAt: Date | null },
  action: 'pause' | 'unpause' | 'delete',
  opts: { reason?: string; now?: Date } = {},
): { ok: true; data: Record<string, unknown> } | Fail {
  const now = opts.now ?? new Date()
  if (listing.deletedAt) return { ok: false, reason: 'El anuncio ya está eliminado' }
  const reason = (opts.reason ?? '').trim()
  if ((action === 'pause' || action === 'delete') && (reason.length < 3 || reason.length > 300)) {
    return { ok: false, reason: 'El motivo debe tener entre 3 y 300 caracteres' }
  }
  if (action === 'pause') {
    if (listing.adminPausedAt) return { ok: false, reason: 'Ya está pausado por moderación' }
    return {
      ok: true,
      data: { status: listing.status === 'ACTIVE' ? 'PAUSED' : listing.status, adminPausedAt: now, adminPausedReason: reason },
    }
  }
  if (action === 'unpause') {
    if (!listing.adminPausedAt) return { ok: false, reason: 'El anuncio no está pausado por moderación' }
    return { ok: true, data: { adminPausedAt: null, adminPausedReason: null } }
  }
  if (action === 'delete') return { ok: true, data: { deletedAt: now } }
  return { ok: false, reason: 'Acción no válida' }
}

export function canModerateUser(
  actor: { id: string },
  target: { id: string; role: string; deletedAt: Date | null },
): { ok: true } | Fail {
  if (target.id === actor.id) return { ok: false, reason: 'No puedes moderarte a ti mismo' }
  if (target.role === 'ADMIN') return { ok: false, reason: 'No se puede moderar a otro administrador' }
  if (target.deletedAt) return { ok: false, reason: 'La cuenta está eliminada' }
  return { ok: true }
}
