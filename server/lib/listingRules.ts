// Reglas puras del ciclo de vida de un anuncio (sin Nuxt ni Prisma, testeable)
type Fail = { ok: false; reason: string }

export function canPublish(l: {
  status: string
  photosCount: number
  scenesCount: number
  contactConsentAt: Date | null
  adminPausedAt: Date | null
}): { ok: true } | Fail {
  if (l.adminPausedAt) {
    return { ok: false, reason: 'Este anuncio está pausado por moderación y no se puede publicar' }
  }
  if (l.status !== 'DRAFT' && l.status !== 'PAUSED') {
    return { ok: false, reason: 'Este anuncio no se puede publicar en su estado actual' }
  }
  if (l.photosCount < 1 && l.scenesCount < 1) {
    return { ok: false, reason: 'Añade al menos una foto o una escena 360° antes de publicar' }
  }
  if (!l.contactConsentAt) {
    return { ok: false, reason: 'Debes aceptar que tu contacto sea visible públicamente' }
  }
  return { ok: true }
}

const TRANSITIONS: Record<string, Record<string, string>> = {
  publish: { DRAFT: 'ACTIVE', PAUSED: 'ACTIVE' },
  pause: { ACTIVE: 'PAUSED' },
  resume: { PAUSED: 'ACTIVE' },
}

export function nextOwnerStatus(current: string, action: 'publish' | 'pause' | 'resume'): { ok: true; status: string } | Fail {
  const status = Object.hasOwn(TRANSITIONS, action) ? TRANSITIONS[action]![current] : undefined
  return status ? { ok: true, status } : { ok: false, reason: 'Acción no permitida en el estado actual del anuncio' }
}

export function anonymizedUserData(id: string, now: Date = new Date()) {
  return {
    name: 'Usuario eliminado',
    email: `deleted-${id}@paseito.invalid`,
    emailVerified: false,
    phone: null,
    image: null,
    instagramUrl: null,
    facebookUrl: null,
    tiktokUrl: null,
    websiteUrl: null,
    deletedAt: now,
  }
}
