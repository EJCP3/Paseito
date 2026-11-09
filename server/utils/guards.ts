// Guards de autorización para endpoints (auto-importado desde server/utils)
import type { H3Event } from 'h3'

/** Sesión válida o 401; cuentas suspendidas/eliminadas → 403 */
export async function requireUser(event: H3Event) {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }
  const user = session.user as typeof session.user & { role?: string | null; suspended?: boolean | null; deletedAt?: Date | null }
  if (user.suspended || user.deletedAt) {
    throw createError({ statusCode: 403, statusMessage: 'Cuenta no disponible' })
  }
  return { ...session, user }
}

export async function requireAdmin(event: H3Event) {
  const session = await requireUser(event)
  if (session.user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Acceso denegado' })
  }
  return session
}

/** Anuncio propio y no borrado: 404 si no existe/está borrado, 403 si es de otro */
export async function requireOwnedListing(listingId: string, userId: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { ownerId: true, deletedAt: true } })
  if (!listing || listing.deletedAt) {
    throw createError({ statusCode: 404, statusMessage: 'Anuncio no encontrado' })
  }
  if (listing.ownerId !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'No tienes permiso para editar este anuncio' })
  }
  return listing
}
