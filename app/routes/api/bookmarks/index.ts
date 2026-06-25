import type { Handler } from "hono";
import { z } from "zod";

const BookmarkSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
});

const dummyBookmarks = [
  {
    id: "018ed000-0001-7000-8000-000000000001",
    title: "Hono",
    url: "https://hono.dev",
  },
];

// 💡 配列（[Handler]）としてエクスポートする
// これにより、HonoXのルーター内部の「...iterable」の要求を満たします
export const GET: [Handler] = [
  (c) => {
    const parsed = z.array(BookmarkSchema).safeParse(dummyBookmarks);

    if (!parsed.success) {
      return c.json({ error: "Internal Server Error" }, 500);
    }

    return c.json(parsed.data);
  },
];
