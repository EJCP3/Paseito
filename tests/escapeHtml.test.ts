import { describe, it, expect } from 'vitest'
import { escapeHtml } from '../shared/utils/escapeHtml'

describe('escapeHtml', () => {
  it('neutraliza <img onerror>', () => {
    const out = escapeHtml('<img src=x onerror="alert(1)">')
    expect(out).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;')
    expect(out).not.toContain('<')
    expect(out).not.toContain('>')
  })

  it('escapa comillas dobles y simples', () => {
    const out = escapeHtml(`"a" 'b'`)
    expect(out).not.toContain('"')
    expect(out).not.toContain("'")
    expect(out).toContain('&quot;')
    expect(out).toMatch(/&#39;|&#x27;|&apos;/)
  })

  it('escapa & primero sin doble escape de las entidades generadas', () => {
    expect(escapeHtml('a & <b>')).toBe('a &amp; &lt;b&gt;')
  })

  it('escapa un & ya existente de entidad (no la interpreta)', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;')
  })

  it('deja intacto el texto normal (incluidos acentos)', () => {
    expect(escapeHtml('Salón con vista')).toBe('Salón con vista')
  })

  it('devuelve cadena vacía para null, undefined y ""', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
    expect(escapeHtml('')).toBe('')
  })
})
