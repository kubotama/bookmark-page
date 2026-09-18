import { z } from 'zod'

import { UuidSchema } from './common'

export const BKRelationSchema = z.object({
  bookmark_id: UuidSchema,
  id: UuidSchema,
  keyword_id: UuidSchema,
})

export type BKRelation = z.infer<typeof BKRelationSchema>

export const AssignParamSchema = z.object({
  bookmark_id: UuidSchema,
})

export const AssignKeywordSchema = z.object({
  keyword_id: UuidSchema,
})

export const AssignRelationPayloadSchema = z.object({
  bookmark_id: UuidSchema,
  keyword_id: UuidSchema,
})

export type AssignRelationPayload = z.infer<typeof AssignRelationPayloadSchema>
