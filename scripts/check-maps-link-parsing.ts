// Self-check para el parseo de links de Google Maps (server/services/geocoding.service.ts).
// No pega a la red: solo valida el allowlist de hosts (barrera anti-SSRF) y la
// extracción de coordenadas desde URLs ya resueltas. Correr con:
//   pnpm exec jiti scripts/check-maps-link-parsing.ts
import assert from 'node:assert'
import { isAllowedMapsUrl, extractCoordsFromUrl } from '../server/services/geocoding.service.ts'

// --- Allowlist de hosts ---
assert.strictEqual(isAllowedMapsUrl('https://maps.app.goo.gl/be4ariGJdEdDACn36'), true, 'short link permitido')
assert.strictEqual(isAllowedMapsUrl('https://www.google.com/maps/place/x/@18,-69,15z'), true, 'google.com permitido')
assert.strictEqual(isAllowedMapsUrl('https://maps.google.com/?q=18,-69'), true, 'maps.google.com permitido')
assert.strictEqual(isAllowedMapsUrl('https://evil.com/google.com'), false, 'host falso rechazado')
assert.strictEqual(isAllowedMapsUrl('http://maps.app.goo.gl/x'), false, 'http (no https) rechazado')
assert.strictEqual(isAllowedMapsUrl('not-a-url'), false, 'URL inválida rechazada')

// --- Extracción de coordenadas: !3d/!4d (punto marcado) gana sobre @ (viewport) ---
assert.deepStrictEqual(
  extractCoordsFromUrl('https://www.google.com/maps/place/X/@18.5,-69.9,17z/data=!3m1!4b1!3d18.4655!4d-69.9313'),
  { lat: 18.4655, lng: -69.9313 },
  '!3d/!4d tiene prioridad sobre @'
)
assert.deepStrictEqual(
  extractCoordsFromUrl('https://www.google.com/maps/@18.4655,-69.9313,15z'),
  { lat: 18.4655, lng: -69.9313 },
  'fallback a @lat,lng'
)
assert.deepStrictEqual(
  extractCoordsFromUrl('https://www.google.com/maps?q=18.4655,-69.9313'),
  { lat: 18.4655, lng: -69.9313 },
  'fallback a ?q=lat,lng'
)
assert.strictEqual(extractCoordsFromUrl('https://www.google.com/maps/place/Sin+coordenadas'), null, 'sin match devuelve null')

console.log('OK — check-maps-link-parsing: todos los casos pasaron')
