import { z } from 'zod'
import {
  LENGTH_LIMITATION,
  SCHEMA_MESSAGE,
} from '../../shared/constants/validation'

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
    .string({ message: SCHEMA_MESSAGE.TITLE_REQUIRED })
    .trim()
    .min(LENGTH_LIMITATION.TITLE.MIN, SCHEMA_MESSAGE.MIN_LENGTH_TITLE)
    .max(LENGTH_LIMITATION.TITLE.MAX, SCHEMA_MESSAGE.MAX_LENGTH_TITLE),

  url: z
    // 💡 ステップ1: まずはただの文字列として「必須」と「文字数」をチェック
    .string()
    .trim()
    .min(1, SCHEMA_MESSAGE.URL_REQUIRED) // 空文字を弾くための明示的なガード
    .max(LENGTH_LIMITATION.URL.MAX, SCHEMA_MESSAGE.MAX_LENGTH_URL)
    // 🎯 ステップ2: 合格した文字列を、Zod v4 推奨の z.url() スキーマに流し込む（バリデーションの結合）
    .pipe(z.url({ message: SCHEMA_MESSAGE.INVALID_URL })),
})

export type CreateBookmarkInput = z.infer<typeof CreateBookmarkSchema>

// 💡 ID（UUID v7形式など）を検証するスキーマ
export const BookmarkIdSchema = z.object({
  id: z.uuid({ message: SCHEMA_MESSAGE.INVALID_ID_FORMAT }),
})
