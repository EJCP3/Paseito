import { describe, it, expect } from 'vitest'
import { listingJsonLd, serializeJsonLd } from '../shared/utils/jsonLd'

const APP = 'https://paseito.do'

const base = {
  slug: 'casa-en-piantini',
  type: 'HOUSE',
  title: 'Casa en Piantini',
  description: 'Casa amplia con patio y piscina.',
  price: '150000', // Decimal de Prisma llega serializado como string
  currency: 'USD',
  city: 'Santo Domingo',
  sector: 'Piantini',
  latitude: 18.47,
  longitude: -69.94,
  photos: [
    { url: 'https://res.cloudinary.com/x/image/upload/a.jpg' },
    { url: 'https://res.cloudinary.com/x/image/upload/b.jpg' },
  ],
  scenes: [{ previewUrl: 'https://res.cloudinary.com/x/image/upload/p.jpg' }],
}

const ld = (over: Record<string, unknown> = {}) => listingJsonLd({ ...base, ...over } as any, APP) as any

describe('listingJsonLd', () => {
  it.each([
    ['APARTMENT', 'Apartment'],
    ['HOUSE', 'House'],
    ['VILLA', 'Residence'],
  ])('%s → @type %s', (type, expected) => {
    expect(ld({ type })['@type']).toBe(expected)
  })

  it('usa el contexto de schema.org', () => {
    expect(ld()['@context']).toBe('https://schema.org')
  })

  it('url canónica = appUrl/anuncio/slug', () => {
    expect(ld().url).toBe(`${APP}/anuncio/casa-en-piantini`)
  })

  it('offers es un Offer con precio numérico y moneda', () => {
    expect(ld().offers).toMatchObject({ '@type': 'Offer', price: 150000, priceCurrency: 'USD' })
    expect(typeof ld().offers.price).toBe('number')
  })

  it('address usa city como addressLocality y sector como addressRegion', () => {
    expect(ld().address).toMatchObject({ addressLocality: 'Santo Domingo', addressRegion: 'Piantini' })
  })

  it('incluye geo cuando hay latitud y longitud', () => {
    expect(ld().geo).toMatchObject({ latitude: 18.47, longitude: -69.94 })
  })

  it('omite geo si falta la coordenada', () => {
    expect(ld({ latitude: null, longitude: null }).geo).toBeUndefined()
    expect(ld({ latitude: undefined, longitude: undefined }).geo).toBeUndefined()
  })

  it('image es un array con las fotos', () => {
    const image = ld().image
    expect(Array.isArray(image)).toBe(true)
    expect(image).toContain(base.photos[0]!.url)
  })

  it('sin fotos usa el preview de la escena', () => {
    expect(ld({ photos: [] }).image).toEqual([base.scenes[0]!.previewUrl])
  })

  it('sin fotos ni escenas no incluye image', () => {
    expect(ld({ photos: [], scenes: [] }).image).toBeUndefined()
  })
})

describe('serializeJsonLd', () => {
  it('un título con </script> no deja "<" literal en la salida', () => {
    const out = serializeJsonLd(ld({ title: 'Hola</script><script>alert(1)</script>' }))
    expect(typeof out).toBe('string')
    expect(out).not.toContain('</')
    expect(out).not.toContain('<')
    expect(out).toContain('\\u003c')
  })

  it('el resultado sigue siendo JSON válido que conserva el texto original', () => {
    const title = 'Hola</script>'
    expect(JSON.parse(serializeJsonLd({ name: title })).name).toBe(title)
  })
})
