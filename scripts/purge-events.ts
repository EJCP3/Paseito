// Script — borra ListingEvent más viejos que N días (por defecto 395 ≈ 13 meses).
// Correr: node --env-file=.env --experimental-strip-types scripts/purge-events.ts [dias]
import { PrismaClient } from '@prisma/client'
import { purgeOldEvents } from '../server/lib/analytics.ts'

const prisma = new PrismaClient()

async function main() {
  const days = process.argv[2] ? Number(process.argv[2]) : 395
  if (!Number.isInteger(days) || days < 1) throw new Error('Uso: purge-events.ts [dias>=1]')
  const n = await purgeOldEvents(prisma, days)
  console.log(`${n} eventos borrados (más de ${days} días)`)
}

main()
  .catch((e) => { console.error(e.message); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
