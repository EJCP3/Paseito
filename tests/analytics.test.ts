import { describe, it, expect } from 'vitest'
import {
  CONTACT_CHANNELS,
  visitorHash,
  normalizeIp,
  dailySalt,
  shouldRecord,
  dedupeWindowMs,
  dedupeKey,
  summarizeEvents,
} from '../server/lib/analytics'

const MIN = 60_000
const IP = '203.0.113.42'
const UA = 'Mozilla/5.0 (Test)'
const SALT = 'sal-del-dia'

describe('CONTACT_CHANNELS', () => {
  it('fija el orden de canales (el índice es lo que se guarda en value)', () => {
    expect([...CONTACT_CHANNELS]).toEqual(['whatsapp', 'instagram', 'facebook', 'tiktok', 'website'])
  })
})

describe('visitorHash', () => {
  it('es determinista', () => {
    expect(visitorHash(IP, UA, SALT)).toBe(visitorHash(IP, UA, SALT))
  })

  it('devuelve 32 caracteres hex', () => {
    expect(visitorHash(IP, UA, SALT)).toMatch(/^[0-9a-f]{32}$/)
  })

  it('cambia si cambia la ip', () => {
    expect(visitorHash('203.0.113.43', UA, SALT)).not.toBe(visitorHash(IP, UA, SALT))
  })

  it('cambia si cambia el user agent', () => {
    expect(visitorHash(IP, 'Otro UA', SALT)).not.toBe(visitorHash(IP, UA, SALT))
  })

  it('cambia si cambia la sal', () => {
    expect(visitorHash(IP, UA, 'otra-sal')).not.toBe(visitorHash(IP, UA, SALT))
  })

  it('no contiene la ip en claro', () => {
    expect(visitorHash(IP, UA, SALT)).not.toContain(IP)
  })
})

describe('normalizeIp', () => {
  it('deja IPv4 igual', () => {
    expect(normalizeIp('203.0.113.42')).toBe('203.0.113.42')
  })

  it('recorta IPv6 a /64', () => {
    const a = normalizeIp('2001:db8:1:2:aaaa:bbbb:cccc:dddd')
    expect(a).toBe(normalizeIp('2001:db8:1:2::1'))
    expect(a).not.toBe(normalizeIp('2001:db8:1:3::1'))
  })

  it('::ffff:1.2.3.4 → 1.2.3.4', () => {
    expect(normalizeIp('::ffff:1.2.3.4')).toBe('1.2.3.4')
  })
})

describe('dailySalt', () => {
  const SECRET = 'secreto-de-prueba'

  it('es igual para dos horas del mismo día UTC', () => {
    const a = dailySalt(new Date('2026-11-09T00:05:00Z'), SECRET)
    const b = dailySalt(new Date('2026-11-09T23:55:00Z'), SECRET)
    expect(a).toBe(b)
  })

  it('es distinta para días distintos', () => {
    const a = dailySalt(new Date('2026-11-09T23:59:59Z'), SECRET)
    const b = dailySalt(new Date('2026-11-10T00:00:00Z'), SECRET)
    expect(a).not.toBe(b)
  })

  it('es distinta para secretos distintos', () => {
    const d = new Date('2026-11-09T12:00:00Z')
    expect(dailySalt(d, SECRET)).not.toBe(dailySalt(d, 'otro-secreto'))
  })
})

describe('shouldRecord', () => {
  const W = 30 * MIN

  it('devuelve true la primera vez y guarda now', () => {
    const store = new Map<string, number>()
    expect(shouldRecord(store, 'k', 1000, W)).toBe(true)
    expect(store.get('k')).toBe(1000)
  })

  it('devuelve false dentro de la ventana', () => {
    const store = new Map<string, number>()
    shouldRecord(store, 'k', 1000, W)
    expect(shouldRecord(store, 'k', 1000 + W - 1, W)).toBe(false)
  })

  it('devuelve true de nuevo al pasar la ventana', () => {
    const store = new Map<string, number>()
    shouldRecord(store, 'k', 1000, W)
    expect(shouldRecord(store, 'k', 1000 + W, W)).toBe(true)
  })

  it('las claves son independientes', () => {
    const store = new Map<string, number>()
    shouldRecord(store, 'a', 1000, W)
    expect(shouldRecord(store, 'b', 1001, W)).toBe(true)
    expect(shouldRecord(store, 'a', 1002, W)).toBe(false)
  })
})

describe('dedupeWindowMs', () => {
  it.each(['VIEW', 'TOUR_OPEN', 'TOUR_TIME'] as const)('%s → 30 min', (type) => {
    expect(dedupeWindowMs(type)).toBe(30 * MIN)
  })

  it('CONTACT_CLICK → 5 min', () => {
    expect(dedupeWindowMs('CONTACT_CLICK', 'whatsapp')).toBe(5 * MIN)
  })

})

describe('dedupeKey', () => {
  it('es estable para los mismos argumentos', () => {
    expect(dedupeKey('v1', 'l1', 'VIEW')).toBe(dedupeKey('v1', 'l1', 'VIEW'))
  })

  it('distingue visitante, anuncio y tipo', () => {
    const base = dedupeKey('v1', 'l1', 'VIEW')
    expect(dedupeKey('v2', 'l1', 'VIEW')).not.toBe(base)
    expect(dedupeKey('v1', 'l2', 'VIEW')).not.toBe(base)
    expect(dedupeKey('v1', 'l1', 'TOUR_OPEN')).not.toBe(base)
  })

  it('incluye el canal en CONTACT_CLICK (dos canales no se pisan)', () => {
    expect(dedupeKey('v1', 'l1', 'CONTACT_CLICK', 'whatsapp')).not.toBe(
      dedupeKey('v1', 'l1', 'CONTACT_CLICK', 'instagram'),
    )
  })

  it('con dedupe real: un clic en whatsapp no bloquea uno en instagram', () => {
    const store = new Map<string, number>()
    const w = dedupeWindowMs('CONTACT_CLICK', 'whatsapp')
    expect(shouldRecord(store, dedupeKey('v1', 'l1', 'CONTACT_CLICK', 'whatsapp'), 0, w)).toBe(true)
    expect(shouldRecord(store, dedupeKey('v1', 'l1', 'CONTACT_CLICK', 'instagram'), 1, w)).toBe(true)
    expect(shouldRecord(store, dedupeKey('v1', 'l1', 'CONTACT_CLICK', 'whatsapp'), 2, w)).toBe(false)
  })
})

describe('summarizeEvents', () => {
  it('devuelve todo a cero sin filas', () => {
    expect(summarizeEvents([])).toEqual({
      views: 0,
      contactClicks: 0,
      tourOpens: 0,
      avgTourSeconds: 0,
      byChannel: { whatsapp: 0, instagram: 0, facebook: 0, tiktok: 0, website: 0 },
      byDay: [],
    })
  })

  it('suma por tipo, calcula media del tour, desglosa canal y ordena byDay', () => {
    // Filas desordenadas a propósito; CONTACT_CLICK llega una fila por (día, canal).
    const rows = [
      { type: 'VIEW', day: '2026-11-03', count: 4 },
      { type: 'CONTACT_CLICK', day: '2026-11-01', count: 2, channelIndex: 0 },
      { type: 'VIEW', day: '2026-11-01', count: 10 },
      { type: 'CONTACT_CLICK', day: '2026-11-01', count: 1, channelIndex: 4 },
      { type: 'TOUR_OPEN', day: '2026-11-01', count: 3 },
      { type: 'TOUR_TIME', day: '2026-11-01', count: 2, sumValue: 100 },
      { type: 'TOUR_TIME', day: '2026-11-03', count: 1, sumValue: 51 },
      { type: 'CONTACT_CLICK', day: '2026-11-02', count: 5, channelIndex: 0 },
    ]
    const s = summarizeEvents(rows)

    expect(s.views).toBe(14)
    expect(s.contactClicks).toBe(8)
    expect(s.tourOpens).toBe(3)
    expect(s.avgTourSeconds).toBe(50) // 151 / 3 = 50.33 → 50
    expect(s.byChannel).toEqual({ whatsapp: 7, instagram: 0, facebook: 0, tiktok: 0, website: 1 })
    expect(s.byDay).toEqual([
      { date: '2026-11-01', views: 10, contactClicks: 3 },
      { date: '2026-11-02', views: 0, contactClicks: 5 },
      { date: '2026-11-03', views: 4, contactClicks: 0 },
    ])
  })

  it('redondea avgTourSeconds al entero más cercano', () => {
    const s = summarizeEvents([{ type: 'TOUR_TIME', day: '2026-11-01', count: 2, sumValue: 91 }])
    expect(s.avgTourSeconds).toBe(46) // 45.5 → 46
  })

  it('avgTourSeconds es 0 si no hay TOUR_TIME aunque haya otras filas', () => {
    expect(summarizeEvents([{ type: 'VIEW', day: '2026-11-01', count: 3 }]).avgTourSeconds).toBe(0)
  })

  it('trata sumValue null como 0', () => {
    const s = summarizeEvents([{ type: 'TOUR_TIME', day: '2026-11-01', count: 2, sumValue: null }])
    expect(s.avgTourSeconds).toBe(0)
  })
})
