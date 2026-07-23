// Catch-all handler — delega todas las rutas /api/auth/* a Better Auth
import { toWebRequest } from 'h3'

export default defineEventHandler((event) => {
  return auth.handler(toWebRequest(event))
})
