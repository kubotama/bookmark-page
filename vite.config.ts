import honox from "honox/vite";
import preact from "@preact/preset-vite";
import { defineConfig } from "vitest/config";

const isTest = process.env.VITEST !== undefined;

export default defineConfig({
  plugins: isTest
    ? [] // テスト時は重い HonoX / Preact のプラグインをスキップして最速化
    : [
        honox({
          entry: "app/server.ts",
          client: {
            input: ["/app/client.ts"],
          },
        }),
        preact(),
      ],
  test: {
    globals: true,
    environment: "happy-dom",
    include: ["app/**/*.test.{ts,tsx}"],
  },
});
