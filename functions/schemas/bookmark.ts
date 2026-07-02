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
    // 💡 ステップ1: まずはただの文字列として「必須」と「文字数」をチェック
    .string()
    .trim()
    .min(1, 'URLは必須です') // 空文字を弾くための明示的なガード
    .max(2048, 'URLは2048文字以内で入力してください')
    // 🎯 ステップ2: 合格した文字列を、Zod v4 推奨の z.url() スキーマに流し込む（バリデーションの結合）
    .pipe(z.url({ message: '不正なURL形式です' })),
})

export type CreateBookmarkInput = z.infer<typeof CreateBookmarkSchema>
