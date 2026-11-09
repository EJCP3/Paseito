// Script — da rol ADMIN a un usuario existente (idempotente).
// Correr: node --env-file=.env --experimental-strip-types scripts/make-admin.ts <email>
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]?.trim().toLowerCase()
  if (!email) throw new Error('Uso: make-admin.ts <email>')
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } })
  if (!user) throw new Error(`No existe un usuario con el correo ${email}`)
  if (user.role === 'ADMIN') return console.log(`${email} ya es ADMIN`)
  await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } })
  console.log(`${email} ahora es ADMIN`)
}

main()
  .catch((e) => { console.error(e.message); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
