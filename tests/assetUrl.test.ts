import { describe, it, expect } from 'vitest'
import { isListingAssetUrl } from '../server/lib/assetUrl'

const CLOUD = 'paseitocloud'
const ID = 'abc'
const base = `https://res.cloudinary.com/${CLOUD}/image/upload`

describe('isListingAssetUrl', () => {
  describe('acepta', () => {
    it('la URL propia con versión', () => {
      expect(isListingAssetUrl(`${base}/v1712345678/paseito/listings/${ID}/foto.jpg`, CLOUD, ID)).toBe(true)
    })

    it('la URL propia sin versión', () => {
      expect(isListingAssetUrl(`${base}/paseito/listings/${ID}/foto.jpg`, CLOUD, ID)).toBe(true)
    })

    it('la thumb con transformación y versión', () => {
      const url = `${base}/w_500,h_500,c_fill,q_auto,f_auto/v1/paseito/listings/${ID}/x.jpg`
      expect(isListingAssetUrl(url, CLOUD, ID)).toBe(true)
    })
  })

  describe('rechaza', () => {
    it('otro listing', () => {
      expect(isListingAssetUrl(`${base}/v1/paseito/listings/otro/foto.jpg`, CLOUD, ID)).toBe(false)
    })

    it('una carpeta cuyo nombre empieza por el listingId (abc vs abcd)', () => {
      expect(isListingAssetUrl(`${base}/v1/paseito/listings/abcd/foto.jpg`, CLOUD, ID)).toBe(false)
    })

    it('otro cloud', () => {
      const url = `https://res.cloudinary.com/otrocloud/image/upload/v1/paseito/listings/${ID}/foto.jpg`
      expect(isListingAssetUrl(url, CLOUD, ID)).toBe(false)
    })

    it('un cloud cuyo nombre empieza por el propio', () => {
      const url = `https://res.cloudinary.com/${CLOUD}x/image/upload/v1/paseito/listings/${ID}/foto.jpg`
      expect(isListingAssetUrl(url, CLOUD, ID)).toBe(false)
    })

    it('otro host', () => {
      const url = `https://evil.com/${CLOUD}/image/upload/v1/paseito/listings/${ID}/foto.jpg`
      expect(isListingAssetUrl(url, CLOUD, ID)).toBe(false)
    })

    it('un host que contiene res.cloudinary.com como subdominio', () => {
      const url = `https://res.cloudinary.com.evil.com/${CLOUD}/image/upload/v1/paseito/listings/${ID}/foto.jpg`
      expect(isListingAssetUrl(url, CLOUD, ID)).toBe(false)
    })

    it('http', () => {
      const url = `http://res.cloudinary.com/${CLOUD}/image/upload/v1/paseito/listings/${ID}/foto.jpg`
      expect(isListingAssetUrl(url, CLOUD, ID)).toBe(false)
    })

    it('path traversal con ..', () => {
      const url = `${base}/v1/paseito/listings/${ID}/../otro/foto.jpg`
      expect(isListingAssetUrl(url, CLOUD, ID)).toBe(false)
    })

    it('path traversal codificado %2e%2e', () => {
      const url = `${base}/v1/paseito/listings/${ID}/%2e%2e/otro/foto.jpg`
      expect(isListingAssetUrl(url, CLOUD, ID)).toBe(false)
    })

    it('path traversal codificado en mayúsculas %2E%2E', () => {
      const url = `${base}/v1/paseito/listings/${ID}/%2E%2E/otro/foto.jpg`
      expect(isListingAssetUrl(url, CLOUD, ID)).toBe(false)
    })

    it('la carpeta sin nombre de archivo', () => {
      expect(isListingAssetUrl(`${base}/v1/paseito/listings/${ID}/`, CLOUD, ID)).toBe(false)
    })

    it('paseito/listings fuera de /image/upload/', () => {
      const url = `https://res.cloudinary.com/${CLOUD}/raw/upload/v1/paseito/listings/${ID}/foto.jpg`
      expect(isListingAssetUrl(url, CLOUD, ID)).toBe(false)
    })

    it('una URL inválida', () => {
      expect(isListingAssetUrl('no es una url', CLOUD, ID)).toBe(false)
      expect(isListingAssetUrl('', CLOUD, ID)).toBe(false)
    })

    it('javascript: y data:', () => {
      expect(isListingAssetUrl('javascript:alert(1)', CLOUD, ID)).toBe(false)
      expect(isListingAssetUrl('data:image/png;base64,AAAA', CLOUD, ID)).toBe(false)
    })
  })
})
