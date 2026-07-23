// GET /api/users/:id/profile — Perfil público del vendedor (SellerProfileModal)
import { UserIdParamSchema } from '~~/shared/schemas/user.schema'
import { getUserProfile } from '~~/server/services/user.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const parsed = UserIdParamSchema.safeParse(id)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'ID de usuario inválido' })
  }

  return getUserProfile(parsed.data)
})
