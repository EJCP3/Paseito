// DELETE /api/users/me — Borrar cuenta: anonimiza, pausa anuncios y quita sesiones/credenciales/favoritos
import { anonymizedUserData } from '~~/server/lib/listingRules'

import { Prisma } from '@prisma/client'

const MAX_SESSION_AGE_MS = 24 * 60 * 60 * 1000

export default defineEventHandler(async (event) => {
  const { user, session } = await requireUser(event)

  // Acción destructiva: exige un inicio de sesión reciente
  if (Date.now() - new Date(session.createdAt).getTime() > MAX_SESSION_AGE_MS) {
    throw createError({ statusCode: 403, statusMessage: 'Por seguridad, vuelve a iniciar sesión para eliminar tu cuenta' })
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: anonymizedUserData(user.id) }),
    prisma.listing.updateMany({
      where: { ownerId: user.id, deletedAt: null },
      data: { status: 'PAUSED', contacts: Prisma.DbNull }, // sin datos de contacto públicos
    }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
    prisma.account.deleteMany({ where: { userId: user.id } }),
    prisma.favorite.deleteMany({ where: { userId: user.id } }),
  ])

  return { success: true }
})
