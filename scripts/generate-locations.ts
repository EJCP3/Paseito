// Script — genera shared/data/rd-locations.json desde el dataset abierto
// codigos-postales-rd (INPOSDOM, MIT License).
// Se corre UNA VEZ (o cuando se quiera refrescar el dataset), no en cada build:
//   node --experimental-strip-types scripts/generate-locations.ts
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const SOURCE = 'https://raw.githubusercontent.com/gareladev/codigos-postales-rd/master/zipcodes_rd.json'

// Tabla de prefijos (2 primeros dígitos del zipcode) → provincia, según el README del repo.
// El prefijo 15 no figura en la tabla pero corresponde a municipios de Santo Domingo
// provincia (Boca Chica, Guerra, Pedro Brand).
const PREFIX_TO_PROVINCE: Record<string, string> = {
  '10': 'Distrito Nacional',
  '11': 'Santo Domingo',
  '15': 'Santo Domingo',
  '21': 'San Pedro de Macorís',
  '22': 'La Romana',
  '23': 'La Altagracia',
  '24': 'El Seibo',
  '25': 'Hato Mayor',
  '31': 'Duarte',
  '32': 'Samaná',
  '33': 'María Trinidad Sánchez',
  '34': 'Hermanas Mirabal',
  '41': 'La Vega',
  '42': 'Monseñor Nouel',
  '43': 'Sánchez Ramírez',
  '51': 'Santiago',
  '53': 'Santiago',
  '56': 'Espaillat',
  '57': 'Puerto Plata',
  '58': 'Puerto Plata',
  '61': 'Valverde',
  '62': 'Monte Cristi',
  '63': 'Dajabón',
  '64': 'Santiago Rodríguez',
  '71': 'Azua',
  '72': 'San Juan',
  '73': 'Elías Piña',
  '81': 'Barahona',
  '82': 'Baoruco',
  '83': 'Independencia',
  '84': 'Pedernales',
  '91': 'San Cristóbal',
  '92': 'Monte Plata',
  '93': 'San José de Ocoa',
  '94': 'Peravia',
}

interface ZipRecord {
  zipcode: string
  place: string
}

const res = await fetch(SOURCE)
if (!res.ok) throw new Error(`No se pudo descargar el dataset: HTTP ${res.status}`)
const records = (await res.json()) as ZipRecord[]

const byProvince = new Map<string, Set<string>>()
let skipped = 0

for (const r of records) {
  const zipcode = (r.zipcode || '').trim()
  const place = (r.place || '').trim().replace(/\s+/g, ' ')
  const province = PREFIX_TO_PROVINCE[zipcode.slice(0, 2)]

  // Registros sucios del dataset (zipcode vacío o "Sin titulo") se descartan
  if (!province || !place || !/^\d{5}$/.test(zipcode)) {
    skipped++
    continue
  }

  if (!byProvince.has(province)) byProvince.set(province, new Set())
  byProvince.get(province)!.add(place)
}

const collator = new Intl.Collator('es')
const output = [...byProvince.entries()]
  .map(([city, sectors]) => ({ city, sectors: [...sectors].sort(collator.compare) }))
  .sort((a, b) => collator.compare(a.city, b.city))

const outPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'shared', 'data', 'rd-locations.json')
mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n', 'utf8')

const totalSectors = output.reduce((n, l) => n + l.sectors.length, 0)
console.log(`OK: ${output.length} provincias, ${totalSectors} sectores únicos (${skipped} registros descartados) → ${outPath}`)
