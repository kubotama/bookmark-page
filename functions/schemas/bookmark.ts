import { z } from 'zod'
import {
  LENGTH_LIMITATION,
  SCHEMA_MESSAGE,
} from '../../shared/constants/validation'

// Zodで型を定義（バリデーションや安全なパース用）
export const BookmarkIdSchema = z.uuid({
  message: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
})

export type BookmarkId = z.infer<typeof BookmarkIdSchema>

export const BookmarkTitleSchema = z
  .string({ message: SCHEMA_MESSAGE.TITLE_REQUIRED })
  .trim()
  .min(LENGTH_LIMITATION.TITLE.MIN, SCHEMA_MESSAGE.MIN_LENGTH_TITLE)
  .max(LENGTH_LIMITATION.TITLE.MAX, SCHEMA_MESSAGE.MAX_LENGTH_TITLE)

export const BookmarkUrlSchema = z
  // 💡 ステップ1: まずはただの文字列として「必須」と「文字数」をチェック
  .string({ message: SCHEMA_MESSAGE.URL_REQUIRED })
  .trim()
  .min(1, SCHEMA_MESSAGE.URL_REQUIRED) // 空文字を弾くための明示的なガード
  .max(LENGTH_LIMITATION.URL.MAX, SCHEMA_MESSAGE.MAX_LENGTH_URL)
  .refine((val) => val.startsWith('http://') || val.startsWith('https://'), {
    message: SCHEMA_MESSAGE.START_PROTOCOL,
  })
  // 🎯 ステップ2: 合格した文字列を、Zod v4 推奨の z.url() スキーマに流し込む（バリデーションの結合）
  .pipe(z.url({ message: SCHEMA_MESSAGE.INVALID_URL }))

export const BookmarkSchema = z.object({
  id: BookmarkIdSchema,
  title: BookmarkTitleSchema,
  url: BookmarkUrlSchema,
})
export type Bookmark = z.infer<typeof BookmarkSchema>

/**
 * 💡 ブックマーク新規登録時のバリデーションスキーマ
 */
export const CreateBookmarkSchema = z.object({
  title: BookmarkTitleSchema,
  url: BookmarkUrlSchema,
})

export type CreateBookmarkInput = z.infer<typeof CreateBookmarkSchema>

// 💡 ID（UUID v7形式など）を検証するスキーマ
export const BookmarkIdParamSchema = z.object({
  id: BookmarkIdSchema,
})

// 💡 どちらか片方だけの送信は「不可」。必ず両方を要求する
export const UpdateBookmarkSchema = z.object({
  title: BookmarkTitleSchema,
  url: BookmarkUrlSchema,
})

export type UpdateBookmarkPayload = z.infer<typeof UpdateBookmarkSchema> & {
  id: BookmarkId
}
