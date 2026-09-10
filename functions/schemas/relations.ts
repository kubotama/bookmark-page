import { z } from 'zod'

import { UuidSchema } from './common'

export const BKRelationSchema = z.object({
  bookmark_id: UuidSchema,
  id: UuidSchema,
  keyword_id: UuidSchema,
})

export type BKRelation = z.infer<typeof BKRelationSchema>
