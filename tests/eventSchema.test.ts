import { describe, it, expect } from 'vitest'
import { EventInputSchema } from '../shared/schemas/event.schema'

const CHANNELS = ['whatsapp', 'instagram', 'facebook', 'tiktok', 'website']

describe('EventInputSchema — acepta', () => {
  it('acepta VIEW sin extras', () => {
    expect(EventInputSchema.safeParse({ type: 'VIEW' }).success).toBe(true)
  })

  it('acepta TOUR_OPEN sin extras', () => {
    expect(EventInputSchema.safeParse({ type: 'TOUR_OPEN' }).success).toBe(true)
  })

  it('acepta TOUR_TIME con value entero en rango', () => {
    const r = EventInputSchema.safeParse({ type: 'TOUR_TIME', value: 45 })
    expect(r.success).toBe(true)
    expect(r.data).toMatchObject({ type: 'TOUR_TIME', value: 45 })
  })

  it('acepta TOUR_TIME con value 1 (mínimo)', () => {
    expect(EventInputSchema.safeParse({ type: 'TOUR_TIME', value: 1 }).success).toBe(true)
  })

  it('acepta TOUR_TIME > 3600 y lo recorta a 3600', () => {
    const r = EventInputSchema.safeParse({ type: 'TOUR_TIME', value: 9999 })
    expect(r.success).toBe(true)
    expect(r.data).toMatchObject({ type: 'TOUR_TIME', value: 3600 })
  })

  it.each(CHANNELS)('acepta CONTACT_CLICK con canal %s', (channel) => {
    const r = EventInputSchema.safeParse({ type: 'CONTACT_CLICK', channel })
    expect(r.success).toBe(true)
    expect(r.data).toMatchObject({ type: 'CONTACT_CLICK', channel })
  })
})

describe('EventInputSchema — rechaza', () => {
  it('rechaza SCHEDULE_CLICK (reservado, no lo envía el cliente)', () => {
    expect(EventInputSchema.safeParse({ type: 'SCHEDULE_CLICK' }).success).toBe(false)
  })

  it('rechaza un tipo desconocido', () => {
    expect(EventInputSchema.safeParse({ type: 'LIKE' }).success).toBe(false)
  })

  it('rechaza sin tipo', () => {
    expect(EventInputSchema.safeParse({}).success).toBe(false)
  })

  it('rechaza TOUR_TIME sin value', () => {
    expect(EventInputSchema.safeParse({ type: 'TOUR_TIME' }).success).toBe(false)
  })

  it.each([
    ['0', 0],
    ['negativo', -5],
    ['decimal', 4.5],
    ['string', '45'],
  ])('rechaza TOUR_TIME con value %s', (_label, value) => {
    expect(EventInputSchema.safeParse({ type: 'TOUR_TIME', value }).success).toBe(false)
  })

  it.each(['VIEW', 'TOUR_OPEN'])('rechaza value en %s', (type) => {
    expect(EventInputSchema.safeParse({ type, value: 10 }).success).toBe(false)
  })

  it('rechaza value en CONTACT_CLICK (el índice lo pone el servidor)', () => {
    expect(EventInputSchema.safeParse({ type: 'CONTACT_CLICK', channel: 'whatsapp', value: 0 }).success).toBe(false)
  })

  it('rechaza CONTACT_CLICK sin channel', () => {
    expect(EventInputSchema.safeParse({ type: 'CONTACT_CLICK' }).success).toBe(false)
  })

  it('rechaza CONTACT_CLICK con canal desconocido', () => {
    expect(EventInputSchema.safeParse({ type: 'CONTACT_CLICK', channel: 'telegram' }).success).toBe(false)
  })

  it('rechaza channel en VIEW', () => {
    expect(EventInputSchema.safeParse({ type: 'VIEW', channel: 'whatsapp' }).success).toBe(false)
  })
})
