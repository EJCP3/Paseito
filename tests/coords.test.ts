import { describe, it, expect } from 'vitest'
import { publicCoords, publicNearby } from '../server/lib/coords'

const listing = () => ({ id: 'l1', ownerId: 'owner', latitude: 18.4861234, longitude: -69.9312117 })

describe('publicCoords', () => {
  it('el dueño ve las coordenadas exactas', () => {
    const r = publicCoords(listing(), 'owner')
    expect(r.latitude).toBe(18.4861234)
    expect(r.longitude).toBe(-69.9312117)
  })

  it('otro usuario las ve redondeadas a 3 decimales', () => {
    const r = publicCoords(listing(), 'otro')
    expect(r.latitude).toBe(18.486)
    expect(r.longitude).toBe(-69.931)
  })

  it('sin sesión (null / undefined) las ve redondeadas', () => {
    expect(publicCoords(listing(), null).latitude).toBe(18.486)
    expect(publicCoords(listing()).longitude).toBe(-69.931)
  })

  it('redondea correctamente hacia arriba', () => {
    const r = publicCoords({ ownerId: 'owner', latitude: 18.4867, longitude: -69.9316 }, 'otro')
    expect(r.latitude).toBe(18.487)
    expect(r.longitude).toBe(-69.932)
  })

  it('no trata undefined como dueño cuando el listing no tiene ownerId', () => {
    const r = publicCoords({ latitude: 18.4861234, longitude: -69.9312117 }, undefined)
    expect(r.latitude).toBe(18.486)
  })

  it('mantiene null como null', () => {
    const r = publicCoords({ ownerId: 'owner', latitude: null, longitude: null }, 'otro')
    expect(r.latitude).toBeNull()
    expect(r.longitude).toBeNull()
  })

  it('conserva el resto de campos', () => {
    const r = publicCoords(listing(), 'otro')
    expect(r.id).toBe('l1')
    expect(r.ownerId).toBe('owner')
  })

  it('no muta la entrada', () => {
    const input = listing()
    const r = publicCoords(input, 'otro')
    expect(input.latitude).toBe(18.4861234)
    expect(input.longitude).toBe(-69.9312117)
    expect(r).not.toBe(input)
  })
})

describe('publicNearby', () => {
  it('redondea distanceM a 100 m y conserva el resto', () => {
    const r = publicNearby([{ id: 'a', distanceM: 149, lat: 1 }, { id: 'b', distanceM: 150 }, { id: 'c', distanceM: 20 }])!
    expect(r.map((p) => p.distanceM)).toEqual([100, 200, 0])
    expect(r[0]).toMatchObject({ id: 'a', lat: 1 })
  })

  it('tolera undefined', () => {
    expect(publicNearby(undefined)).toBeUndefined()
  })
})
