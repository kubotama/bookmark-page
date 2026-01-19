# Bookmark Page

## 概要 (Overview)

`kubotama/linkpage` (Next.js) の機能を Vite (React) + Hono に移植・刷新するプロジェクトです。
個人的なブックマーク（リンク集）を管理・表示するためのアプリケーションです。

## 技術スタック (Tech Stack)

- **Frontend:** Vite, React, TypeScript, Tailwind CSS
- **Backend:** Hono (@hono/node-server), better-sqlite3, Zod
- **Database:** SQLite

## 機能 (Features)

- **ブックマーク一覧取得 API**: データベースから全件取得 (スケーラビリティを考慮したレスポンス構造)
- リンクの表示・管理 (実装予定)

## 環境構築 (Getting Started)

### 前提条件 (Prerequisites)

- Node.js (v20以上必須)

### データベース (Database)

アプリケーション起動時にプロジェクトルートに `bookmarks.sqlite` が自動的に作成され、必要なテーブル（bookmarks, keywords, bookmark_keywords）も初期化されます。手動でデータベースファイルを作成する必要はありません。

### インストール (Installation)

```bash
npm install
```

### 環境変数 (Environment Variables)

`.env.example` をコピーして `.env` ファイルを作成してください。

```bash
cp .env.example .env
```

| 変数名                       | 説明                   | デフォルト値            |
| ---------------------------- | ---------------------- | ----------------------- |
| `BOOKMARK_PAGE_FRONTEND_URL` | CORS許可オリジン設定用 | `http://localhost:5173` |

補足: この環境変数が設定されていない場合、バックエンドはデフォルト値を使用します。

### 開発サーバー起動 (Development)

Frontend (Vite) と Backend (Hono) を同時に起動します。

```bash
npm run dev
```

起動後、以下のURLでアクセスできます：

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3030`

## API 仕様 (API Specifications)

### GET /api/bookmarks

ブックマークの一覧を取得します。

**レスポンス例:**

```json
{
  "bookmarks": [
    {
      "id": "1",
      "title": "Example",
      "url": "https://example.com"
    }
  ]
}
```

### ビルド (Build)

```bash
npm run build
```

### テスト (Testing)

```bash
npm run test
```

テスト実行時は、開発用データベースに影響を与えないよう SQLite のインメモリモード (`:memory:`) が自動的に使用されます。
