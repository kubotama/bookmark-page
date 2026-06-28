import { z } from 'zod'

// Zodで型を定義（バリデーションや安全なパース用）
export const BookmarkSchema = z.object({
  id: z.uuidv7(),
  title: z.string(),
  url: z.url(),
})
export type Bookmark = z.infer<typeof BookmarkSchema>

/**
 * 💡 ブックマーク新規登録時のバリデーションスキーマ
 */
export const CreateBookmarkSchema = z.object({
  title: z
    .string({ message: 'タイトルは必須です' })
    .trim()
    .min(1, 'タイトルは1文字以上で入力してください')
    .max(255, 'タイトルは255文字以内で入力してください'),

  url: z
    .string({ message: 'URLは必須です' })
    .trim()
    .url('不正なURL形式です')
    .max(2048, 'URLは2048文字以内で入力してください'),
})

export type CreateBookmarkInput = z.infer<typeof CreateBookmarkSchema>
