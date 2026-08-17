import { z } from 'zod'

import {
  LENGTH_LIMITATION,
  SCHEMA_MESSAGE,
} from '../../shared/constants/validation'

export const KeywordIdSchema = z.uuid({
  message: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
})

export type KeywordId = z.infer<typeof KeywordIdSchema>

export const KeywordNameSchema = z
  .string({ message: SCHEMA_MESSAGE.TITLE_REQUIRED })
  .trim()
  .min(LENGTH_LIMITATION.NAME.MIN, SCHEMA_MESSAGE.MIN_LENGTH_TITLE)
  .max(LENGTH_LIMITATION.NAME.MAX, SCHEMA_MESSAGE.MAX_LENGTH_TITLE)

export const KeywordSchema = z.object({
  id: KeywordIdSchema,
  name: KeywordNameSchema,
})
export type Keyword = z.infer<typeof KeywordSchema>
