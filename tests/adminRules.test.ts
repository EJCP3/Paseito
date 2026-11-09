import { describe, it, expect } from 'vitest'
import { adminListingAction, canModerateUser } from '../server/lib/adminRules'

const now = new Date('2026-11-08T12:00:00Z')
const active = { status: 'ACTIVE', deletedAt: null, adminPausedAt: null }

function expectFail(r: { ok: boolean; reason?: string }) {
  expect(r.ok).toBe(false)
  expect(typeof (r as any).reason).toBe('string')
  expect((r as any).reason.trim().length).toBeGreaterThan(0)
}

describe('adminListingAction: pause', () => {
  it('pausa con motivo recortado y marca la moderación', () => {
    expect(adminListingAction(active, 'pause', { reason: '  Fotos engañosas  ', now })).toEqual({
      ok: true,
      data: { status: 'PAUSED', adminPausedAt: now, adminPausedReason: 'Fotos engañosas' },
    })
  })

  it('conserva SOLD/DRAFT/PAUSED al pausar por moderación', () => {
    for (const status of ['SOLD', 'DRAFT', 'PAUSED']) {
      const r = adminListingAction({ ...active, status }, 'pause', { reason: 'Motivo válido', now })
      expect((r as any).data.status).toBe(status)
    }
  })

  it('rechaza si ya está pausado por moderación', () => {
    expectFail(adminListingAction({ ...active, status: 'PAUSED', adminPausedAt: new Date() }, 'pause', { reason: 'Motivo válido', now }))
  })

  it('acepta motivo de exactamente 3 y 300 caracteres', () => {
    expect(adminListingAction(active, 'pause', { reason: 'abc', now }).ok).toBe(true)
    expect(adminListingAction(active, 'pause', { reason: 'a'.repeat(300), now }).ok).toBe(true)
  })

  it.each([
    ['sin motivo', undefined],
    ['motivo vacío', ''],
    ['solo espacios', '     '],
    ['2 caracteres tras trim', '  ab  '],
    ['301 caracteres', 'a'.repeat(301)],
  ])('rechaza %s', (_label, reason) => {
    expectFail(adminListingAction(active, 'pause', { reason, now }))
  })
})

describe('adminListingAction: unpause', () => {
  it('limpia la moderación sin tocar el estado', () => {
    const paused = { status: 'PAUSED', deletedAt: null, adminPausedAt: new Date('2026-11-01') }
    const r = adminListingAction(paused, 'unpause', { now })
    expect(r).toEqual({ ok: true, data: { adminPausedAt: null, adminPausedReason: null } })
    expect((r as any).data).not.toHaveProperty('status')
  })

  it('rechaza si no está pausado por moderación', () => {
    expectFail(adminListingAction({ ...active, status: 'PAUSED' }, 'unpause', { now }))
  })
})

describe('adminListingAction: delete', () => {
  it('marca deletedAt con motivo', () => {
    expect(adminListingAction(active, 'delete', { reason: 'Estafa', now })).toEqual({ ok: true, data: { deletedAt: now } })
  })

  it('rechaza sin motivo', () => {
    expectFail(adminListingAction(active, 'delete', { now }))
    expectFail(adminListingAction(active, 'delete', { reason: 'ab', now }))
  })
})

describe('adminListingAction: casos inválidos', () => {
  const deleted = { ...active, deletedAt: new Date('2026-10-01') }

  it.each(['pause', 'unpause', 'delete'] as const)('rechaza %s sobre un anuncio borrado', (action) => {
    expectFail(adminListingAction({ ...deleted, adminPausedAt: new Date() }, action, { reason: 'Motivo válido', now }))
  })

  it('rechaza una acción desconocida', () => {
    expectFail(adminListingAction(active, 'publish' as any, { now }))
  })
})

describe('canModerateUser', () => {
  const actor = { id: 'admin1' }

  it('permite moderar a un usuario normal', () => {
    expect(canModerateUser(actor, { id: 'u1', role: 'USER', deletedAt: null })).toEqual({ ok: true })
  })

  it('rechaza moderarse a sí mismo', () => {
    expectFail(canModerateUser(actor, { id: 'admin1', role: 'USER', deletedAt: null }))
  })

  it('rechaza moderar a otro ADMIN', () => {
    expectFail(canModerateUser(actor, { id: 'admin2', role: 'ADMIN', deletedAt: null }))
  })

  it('rechaza moderar a un usuario borrado', () => {
    expectFail(canModerateUser(actor, { id: 'u2', role: 'USER', deletedAt: new Date() }))
  })
})
