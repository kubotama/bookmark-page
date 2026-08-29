import { z } from 'zod'

import {
  LENGTH_LIMITATION,
  SCHEMA_MESSAGE,
} from '../../shared/constants/validation'
import { UuidSchema } from './common'

export const KeywordNameSchema = z
  .string({ message: SCHEMA_MESSAGE.KEYWORD_REQUIRED })
  .trim()
  .min(LENGTH_LIMITATION.KEYWORD.MIN, SCHEMA_MESSAGE.MIN_LENGTH_KEYWORD)
  .max(LENGTH_LIMITATION.KEYWORD.MAX, SCHEMA_MESSAGE.MAX_LENGTH_KEYWORD)

// 1. 基本となるキーワードエンティティ（id, name）
export const KeywordSchema = z.object({
  id: UuidSchema,
  name: KeywordNameSchema,
})
export type Keyword = z.infer<typeof KeywordSchema>

// 2. 基本スキーマを継承・拡張して bookmark_ids を追加
export const KeywordWithBookmarkIdsSchema = KeywordSchema.extend({
  bookmark_ids: z.string().transform((val) => {
    try {
      return JSON.parse(val) as string[]
    } catch {
      return []
    }
  }),
})
export type KeywordWithBookmarkIds = z.infer<
  typeof KeywordWithBookmarkIdsSchema
>

export const CreateKeywordSchema = z.object({
  bookmark_id: UuidSchema.optional(),
  name: KeywordNameSchema,
})

export type CreateKeywordInput = z.infer<typeof CreateKeywordSchema>
