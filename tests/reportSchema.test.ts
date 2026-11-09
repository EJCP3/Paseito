import { describe, it, expect } from 'vitest'
import { ReportInputSchema } from '../shared/schemas/report.schema'

describe('ReportInputSchema', () => {
  it.each(['SPAM', 'FRAUD', 'INAPPROPRIATE', 'MISLEADING_PRICE'])('acepta %s sin details', (reason) => {
    expect(ReportInputSchema.safeParse({ reason }).success).toBe(true)
  })

  it('acepta un motivo con details opcionales', () => {
    expect(ReportInputSchema.safeParse({ reason: 'FRAUD', details: 'Pide adelanto por transferencia' }).success).toBe(true)
  })

  it('acepta OTHER con details', () => {
    expect(ReportInputSchema.safeParse({ reason: 'OTHER', details: 'El anuncio está duplicado' }).success).toBe(true)
  })

  it('acepta details de exactamente 1000 caracteres', () => {
    expect(ReportInputSchema.safeParse({ reason: 'OTHER', details: 'a'.repeat(1000) }).success).toBe(true)
  })

  it('rechaza un motivo desconocido', () => {
    expect(ReportInputSchema.safeParse({ reason: 'BORING' }).success).toBe(false)
  })

  it('rechaza sin motivo', () => {
    expect(ReportInputSchema.safeParse({ details: 'algo' }).success).toBe(false)
  })

  it('rechaza OTHER sin details', () => {
    expect(ReportInputSchema.safeParse({ reason: 'OTHER' }).success).toBe(false)
  })

  it('rechaza OTHER con details solo espacios', () => {
    expect(ReportInputSchema.safeParse({ reason: 'OTHER', details: '    ' }).success).toBe(false)
  })

  it('rechaza details de más de 1000 caracteres', () => {
    expect(ReportInputSchema.safeParse({ reason: 'SPAM', details: 'a'.repeat(1001) }).success).toBe(false)
  })
})
