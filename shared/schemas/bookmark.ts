import { z } from 'zod'
import { isHttpUrl } from '../utils/url'

export const BookmarkIdSchema = z.string().brand<'BookmarkId'>()
export type BookmarkId = z.infer<typeof BookmarkIdSchema>

export const bookmarkSchema = z.object({
  id: BookmarkIdSchema,
  title: z.string(),
  url: z.string().url().refine(isHttpUrl, {
    message: 'URL は http:// または https:// で始まる必要があります',
  }),
})

export type Bookmark = z.infer<typeof bookmarkSchema>

export const bookmarksResponseSchema = z.object({
  bookmarks: z.array(bookmarkSchema),
})

export type BookmarksResponse = z.infer<typeof bookmarksResponseSchema>
