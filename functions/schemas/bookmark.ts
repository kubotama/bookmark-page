import { z } from "zod"

// Zodで型を定義（バリデーションや安全なパース用）
export const BookmarkSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.url(),
})
export type Bookmark = z.infer<typeof BookmarkSchema>
