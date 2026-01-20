import { z } from 'zod'

export const bookmarkSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
})

export type Bookmark = z.infer<typeof bookmarkSchema>

export const bookmarksResponseSchema = z.object({
  bookmarks: z.array(bookmarkSchema),
})

export type BookmarksResponse = z.infer<typeof bookmarksResponseSchema>
