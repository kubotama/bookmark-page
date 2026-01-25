import { z } from 'zod'
import { isHttpUrl } from '../utils/url'

export type BookmarkId = string

export const bookmarkSchema = z.object({
  id: z.string() as z.ZodType<BookmarkId>,
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
