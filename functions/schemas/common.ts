import { z } from 'zod'

import { SCHEMA_MESSAGE } from '../../shared/constants/validation'

export const UuidSchema = z.uuid({
  message: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
})

export type Uuid = z.infer<typeof UuidSchema>
