import { describe, it, expect } from 'vitest'
import { cld } from '../shared/utils/cloudinary'

const BASE = 'https://res.cloudinary.com/paseitocloud/image/upload'

describe('cld', () => {
  it('inserta la transformación tras /upload/', () => {
    expect(cld(`${BASE}/paseito/listings/a/foto.jpg`, 'f_auto,q_auto,w_600'))
      .toBe(`${BASE}/f_auto,q_auto,w_600/paseito/listings/a/foto.jpg`)
  })

  it('respeta el segmento de versión', () => {
    expect(cld(`${BASE}/v1712345678/paseito/a.jpg`, 'w_600'))
      .toBe(`${BASE}/w_600/v1712345678/paseito/a.jpg`)
  })

  it('reemplaza una transformación existente', () => {
    expect(cld(`${BASE}/w_500,c_fill/v1/paseito/a.jpg`, 'f_auto,q_auto,w_1600'))
      .toBe(`${BASE}/f_auto,q_auto,w_1600/v1/paseito/a.jpg`)
  })

  it('es idempotente', () => {
    const once = cld(`${BASE}/v1/paseito/a.jpg`, 'q_auto,w_4096')
    expect(cld(once, 'q_auto,w_4096')).toBe(once)
  })

  it('no toca URLs que no son de Cloudinary', () => {
    const url = 'https://example.com/image/upload/a.jpg'
    expect(cld(url, 'w_600')).toBe(url)
  })

  it('string vacío devuelve string vacío', () => {
    expect(cld('', 'w_600')).toBe('')
  })

  it('null o undefined devuelven string vacío', () => {
    expect(cld(null as any, 'w_600')).toBe('')
    expect(cld(undefined as any, 'w_600')).toBe('')
  })
})
