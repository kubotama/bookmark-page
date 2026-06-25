import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { GET } from "./index";

describe("GET /api/bookmarks", () => {
  it("ブックマークの一覧がJSON配列で返ってくること", async () => {
    const app = new Hono();

    app.get("/api/bookmarks", ...GET);

    const res = await app.request("/api/bookmarks");

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/json");

    const body = await res.json();
    if (Array.isArray(body)) {
      expect(body[0]).toHaveProperty("title");
      expect(body[0]).toHaveProperty("url");
    } else {
      expect(Array.isArray(body)).toBe(true);
    }
  });
});
