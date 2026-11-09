// Schemas de validación Zod — Contactos/redes sociales del anuncio
// Única fuente de verdad: la usa el form de publicar (feedback inmediato)
// y POST /api/listings (nadie se salta la validación llamando el endpoint directo).
import { z } from 'zod'

export const CONTACT_TYPES = ['whatsapp', 'instagram', 'facebook', 'tiktok', 'website'] as const
export type ContactType = (typeof CONTACT_TYPES)[number]

/**
 * Valida y normaliza el valor de un contacto según su red.
 * Devuelve { ok: true, normalized } o { ok: false, error } con mensaje concreto.
 * Un valor vacío NO pasa por aquí: el contacto es opcional (se filtra antes).
 */
export function parseContactValue(
  type: ContactType,
  raw: string
): { ok: true; normalized: string } | { ok: false; error: string } {
  const value = raw.trim()

  switch (type) {
    case 'whatsapp': {
      // Teléfono E.164: 8-15 dígitos, se admite +, espacios, guiones y paréntesis
      const digits = value.replace(/[\s\-().]/g, '')
      if (!/^\+?\d{8,15}$/.test(digits)) {
        return { ok: false, error: 'Ese número no parece válido. Debe verse como +18095551234.' }
      }
      return { ok: true, normalized: digits.startsWith('+') ? digits : `+${digits}` }
    }

    case 'instagram': {
      // Acepta instagram.com/usuario (con o sin https/www) o @usuario explícito
      const m = value.match(
        /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._]{1,30})\/?$/
      ) || value.match(/^@([A-Za-z0-9._]{1,30})$/)
      if (!m) {
        return { ok: false, error: 'Ese link no parece ser de Instagram. Debe verse como instagram.com/tu_usuario o @tu_usuario.' }
      }
      return { ok: true, normalized: `https://instagram.com/${m[1]}` }
    }

    case 'facebook': {
      const m = value.match(
        /^(?:https?:\/\/)?(?:www\.)?(?:facebook|fb)\.com\/([A-Za-z0-9._\-/?=&%]+)$/
      )
      if (!m) {
        return { ok: false, error: 'Ese link no parece ser de Facebook. Debe verse como facebook.com/tu_pagina.' }
      }
      return { ok: true, normalized: `https://facebook.com/${m[1]!.replace(/\/$/, '')}` }
    }

    case 'tiktok': {
      // Acepta @usuario o tiktok.com/@usuario
      const m = value.match(
        /^(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([A-Za-z0-9._]{1,24})\/?$/
      ) || value.match(/^@([A-Za-z0-9._]{1,24})$/)
      if (!m) {
        return { ok: false, error: 'Ese link no parece ser de TikTok. Debe verse como tiktok.com/@tu_usuario.' }
      }
      return { ok: true, normalized: `https://tiktok.com/@${m[1]}` }
    }

    case 'website': {
      // https:// obligatorio + dominio real (al menos un punto y TLD de 2+ letras)
      if (!/^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}(\/\S*)?$/i.test(value)) {
        return { ok: false, error: 'El sitio web debe ser una URL válida que empiece con https:// (ej. https://tudominio.com).' }
      }
      return { ok: true, normalized: value }
    }
  }
}

// Schema de un contacto: valida el formato según la red y normaliza el valor
export const ContactLinkSchema = z
  .object({
    type: z.enum(CONTACT_TYPES),
    value: z.string().trim().min(1, 'El valor del contacto es requerido').max(300),
  })
  .superRefine((data, ctx) => {
    const result = parseContactValue(data.type, data.value)
    if (!result.ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.error, path: ['value'] })
    }
  })
  .transform((data) => {
    const result = parseContactValue(data.type, data.value)
    return { type: data.type, value: result.ok ? result.normalized : data.value }
  })

export const ContactsArraySchema = z.array(ContactLinkSchema).max(5)
