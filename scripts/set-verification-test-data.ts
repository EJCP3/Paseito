// Script único — marca el primer usuario real como verificado para poder
// probar VerifiedBadge end-to-end (verificationTier se asigna a mano por ahora).
// Correr: node --env-file=.env --experimental-strip-types scripts/set-verification-test-data.ts
import { PrismaClient } from '@prisma/client'

if (process.env.NODE_ENV === 'production') {
  console.error('Abortado: este script modifica usuarios reales y no se corre en producción.')
  process.exit(1)
}

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' }, take: 2 })
  if (!users.length) {
    console.log('No hay usuarios en la base.')
    return
  }

  await prisma.user.update({ where: { id: users[0].id }, data: { verificationTier: 1 } })
  console.log(`Verificado: ${users[0].name} (${users[0].id})`)

  if (users[1]) {
    await prisma.user.update({ where: { id: users[1].id }, data: { verificationTier: 0 } })
    console.log(`Sin verificar: ${users[1].name} (${users[1].id})`)
  }
}

main().finally(() => prisma.$disconnect())
