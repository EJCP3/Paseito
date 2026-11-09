import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { checkImage } from '../server/lib/imageCheck'

const make = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#888' } })

const svg = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="2000"><rect width="4000" height="2000" fill="red"/></svg>',
)

describe('checkImage', () => {
  describe('formato', () => {
    it('acepta jpeg, png y webp como photo', async () => {
      for (const buf of [
        await make(800, 600).jpeg().toBuffer(),
        await make(800, 600).png().toBuffer(),
        await make(800, 600).webp().toBuffer(),
      ]) {
        const r = await checkImage(buf, 'photo')
        expect(r.ok).toBe(true)
      }
    })

    it('devuelve width, height y format de la imagen aceptada', async () => {
      const r = await checkImage(await make(800, 600).jpeg().toBuffer(), 'photo')
      expect(r).toEqual({ ok: true, width: 800, height: 600, format: 'jpeg' })
    })

    it('rechaza svg con 415', async () => {
      const r = await checkImage(svg, 'photo')
      expect(r).toMatchObject({ ok: false, status: 415 })
    })

    it('rechaza svg con 415 también como panorama', async () => {
      const r = await checkImage(svg, 'panorama')
      expect(r).toMatchObject({ ok: false, status: 415 })
    })

    it('rechaza gif con 415', async () => {
      const gif = await make(800, 600).gif().toBuffer()
      const r = await checkImage(gif, 'photo')
      expect(r).toMatchObject({ ok: false, status: 415 })
    })

    it('rechaza basura no-imagen con 415', async () => {
      const r = await checkImage(Buffer.from('esto no es una imagen'), 'photo')
      expect(r).toMatchObject({ ok: false, status: 415 })
    })

    it('rechaza un buffer vacío con 415', async () => {
      const r = await checkImage(Buffer.alloc(0), 'photo')
      expect(r).toMatchObject({ ok: false, status: 415 })
    })

    it('incluye un mensaje en el rechazo', async () => {
      const r = await checkImage(svg, 'photo')
      if (r.ok) throw new Error('debía rechazar')
      expect(r.message.length).toBeGreaterThan(0)
    })
  })

  describe('panorama', () => {
    it('acepta 4000×2000 jpeg', async () => {
      const r = await checkImage(await make(4000, 2000).jpeg().toBuffer(), 'panorama')
      expect(r).toEqual({ ok: true, width: 4000, height: 2000, format: 'jpeg' })
    })

    it('rechaza 1:1 con 422', async () => {
      const r = await checkImage(await make(4000, 4000).jpeg().toBuffer(), 'panorama')
      expect(r).toMatchObject({ ok: false, status: 422 })
    })

    it('rechaza 2:1 de baja resolución con 422', async () => {
      const r = await checkImage(await make(2000, 1000).jpeg().toBuffer(), 'panorama')
      expect(r).toMatchObject({ ok: false, status: 422 })
    })

    it('rechaza panorámica por encima de 8192×4096 con 422', async () => {
      const r = await checkImage(await make(8400, 4200).jpeg().toBuffer(), 'panorama')
      expect(r).toMatchObject({ ok: false, status: 422 })
    })

    it('rechaza ratio por debajo de 1.8 con 422', async () => {
      // 1.75
      const r = await checkImage(await make(7000, 4000).jpeg().toBuffer(), 'panorama')
      expect(r).toMatchObject({ ok: false, status: 422 })
    })

    it('rechaza ratio por encima de 2.2 con 422', async () => {
      // 2.25
      const r = await checkImage(await make(4500, 2000).jpeg().toBuffer(), 'panorama')
      expect(r).toMatchObject({ ok: false, status: 422 })
    })

    it('acepta los bordes del ratio 1.8 y 2.2', async () => {
      expect((await checkImage(await make(4000, 2222).jpeg().toBuffer(), 'panorama')).ok).toBe(true) // ~1.8002
      expect((await checkImage(await make(4400, 2000).jpeg().toBuffer(), 'panorama')).ok).toBe(true) // 2.2
    })

    it('rechaza ratio 2:1 con altura por debajo de 2000 (3998×1999)', async () => {
      const r = await checkImage(await make(3998, 1999).jpeg().toBuffer(), 'panorama')
      expect(r).toMatchObject({ ok: false, status: 422 })
    })
  }, 30000)

  describe('photo', () => {
    it('acepta cualquier proporción (1:1 y 2:1 pequeñas)', async () => {
      expect((await checkImage(await make(500, 500).jpeg().toBuffer(), 'photo')).ok).toBe(true)
      expect((await checkImage(await make(2000, 1000).jpeg().toBuffer(), 'photo')).ok).toBe(true)
      expect((await checkImage(await make(300, 900).png().toBuffer(), 'photo')).ok).toBe(true)
    })
  })
})
