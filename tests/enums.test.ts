import { describe, it, expect } from 'vitest'
import { $Enums } from '@prisma/client'
import * as shared from '../shared/types/enums'

const values = (e: object) => Object.values(e).sort()

describe('enums de shared coinciden con Prisma', () => {
  for (const name of ['ListingStatus', 'Role', 'ReportReason', 'ListingEventType', 'FeaturePlacement'] as const) {
    it(name, () => {
      expect(values((shared as Record<string, object>)[name]!)).toEqual(values($Enums[name]!))
    })
  }

  it('ListingType de shared es subconjunto del de Prisma (sin VEHICLE)', () => {
    const prisma = values($Enums.ListingType)
    for (const v of values(shared.ListingType)) expect(prisma).toContain(v)
  })
})
