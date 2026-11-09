import { describe, it, expect } from 'vitest'
import { FEATURE_PLANS, PAYMENT_INSTRUCTIONS } from '../shared/config/featurePricing'

describe('FEATURE_PLANS', () => {
  it('plan 7d dura 7 días con precios en centavos USD', () => {
    expect(FEATURE_PLANS['7d']).toEqual({ days: 7, prices: { HERO: 1500, SIDEBAR: 800, BADGE: 500 } })
  })

  it('plan 30d dura 30 días con precios en centavos USD', () => {
    expect(FEATURE_PLANS['30d']).toEqual({ days: 30, prices: { HERO: 5000, SIDEBAR: 2500, BADGE: 1500 } })
  })

  it('solo existen los planes 7d y 30d', () => {
    expect(Object.keys(FEATURE_PLANS).sort()).toEqual(['30d', '7d'])
  })
})

describe('PAYMENT_INSTRUCTIONS', () => {
  it('es un texto no vacío', () => {
    expect(typeof PAYMENT_INSTRUCTIONS).toBe('string')
    expect(PAYMENT_INSTRUCTIONS.trim().length).toBeGreaterThan(0)
  })

  it.each(['[BANCO]', '[CUENTA]', '[TITULAR]', '[WHATSAPP DE PAGOS]'])('contiene el marcador %s', (m) => {
    expect(PAYMENT_INSTRUCTIONS).toContain(m)
  })
})
