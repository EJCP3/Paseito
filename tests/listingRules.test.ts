import { describe, it, expect } from 'vitest'
import { canPublish, nextOwnerStatus, anonymizedUserData } from '../server/lib/listingRules'

const base = { status: 'DRAFT', photosCount: 1, scenesCount: 0, contactConsentAt: new Date('2026-01-01'), adminPausedAt: null as Date | null }

function expectFail(r: { ok: boolean; reason?: string }) {
  expect(r.ok).toBe(false)
  expect(typeof (r as any).reason).toBe('string')
  expect((r as any).reason.trim().length).toBeGreaterThan(0)
}

describe('canPublish', () => {
  it('permite publicar un borrador con foto y consentimiento', () => {
    expect(canPublish(base)).toEqual({ ok: true })
  })

  it('permite publicar desde PAUSED', () => {
    expect(canPublish({ ...base, status: 'PAUSED' })).toEqual({ ok: true })
  })

  it('basta con una sola escena sin fotos', () => {
    expect(canPublish({ ...base, photosCount: 0, scenesCount: 1 })).toEqual({ ok: true })
  })

  it('basta con una sola foto sin escenas', () => {
    expect(canPublish({ ...base, photosCount: 1, scenesCount: 0 })).toEqual({ ok: true })
  })

  it('rechaza sin fotos ni escenas', () => {
    expectFail(canPublish({ ...base, photosCount: 0, scenesCount: 0 }))
  })

  it('rechaza sin consentimiento de contacto', () => {
    expectFail(canPublish({ ...base, contactConsentAt: null }))
  })

  it.each(['DRAFT', 'PAUSED'])('rechaza desde %s si está pausado por moderación', (status) => {
    const r = canPublish({ ...base, status, adminPausedAt: new Date() })
    expectFail(r)
    expect((r as any).reason).toMatch(/moderaci[oó]n/i)
  })

  it.each(['ACTIVE', 'PENDING_REVIEW', 'SOLD'])('rechaza desde el estado %s', (status) => {
    expectFail(canPublish({ ...base, status }))
  })
})

describe('nextOwnerStatus', () => {
  it.each([
    ['DRAFT', 'publish', 'ACTIVE'],
    ['PAUSED', 'publish', 'ACTIVE'],
    ['ACTIVE', 'pause', 'PAUSED'],
    ['PAUSED', 'resume', 'ACTIVE'],
  ] as const)('%s + %s → %s', (current, action, status) => {
    expect(nextOwnerStatus(current, action)).toEqual({ ok: true, status })
  })

  it.each([
    ['ACTIVE', 'publish'],
    ['ACTIVE', 'resume'],
    ['DRAFT', 'pause'],
    ['DRAFT', 'resume'],
    ['PAUSED', 'pause'],
    ['PENDING_REVIEW', 'publish'],
    ['PENDING_REVIEW', 'pause'],
    ['PENDING_REVIEW', 'resume'],
    ['SOLD', 'publish'],
    ['SOLD', 'pause'],
    ['SOLD', 'resume'],
  ] as const)('rechaza %s + %s', (current, action) => {
    expectFail(nextOwnerStatus(current, action))
  })

  it('rechaza una acción desconocida', () => {
    expectFail(nextOwnerStatus('DRAFT', 'delete' as any))
  })
})

describe('anonymizedUserData', () => {
  it('devuelve exactamente los campos anonimizados', () => {
    const now = new Date('2026-11-08T12:00:00Z')
    expect(anonymizedUserData('u1', now)).toEqual({
      name: 'Usuario eliminado',
      email: 'deleted-u1@paseito.invalid',
      emailVerified: false,
      phone: null,
      image: null,
      instagramUrl: null,
      facebookUrl: null,
      tiktokUrl: null,
      websiteUrl: null,
      deletedAt: now,
    })
  })

  it('ids distintos producen emails distintos', () => {
    const now = new Date()
    expect(anonymizedUserData('a', now).email).not.toBe(anonymizedUserData('b', now).email)
  })
})
