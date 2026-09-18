import { Keyword } from '../../functions/schemas/keyword'

export const isRegisteredKeyword = (keywords: Keyword[], keywordName: string) =>
  keywords.some((k) => k.name.trim() === keywordName.trim())
