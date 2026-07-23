// Schemas de validación Zod — Usuarios
import { z } from 'zod'

// better-auth genera sus propios IDs (no necesariamente UUID), solo validamos
// que venga un string no vacío.
export const UserIdParamSchema = z.string().min(1, 'ID de usuario inválido')
