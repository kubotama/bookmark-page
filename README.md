# Bookmark Page

## 概要 (Overview)

`kubotama/linkpage` (Next.js) の機能を Vite (React) + Hono に移植・刷新するプロジェクトです。
個人的なブックマーク（リンク集）を管理・表示するためのアプリケーションです。

## 技術スタック (Tech Stack)

- **Frontend:** Vite, React, TypeScript, Tailwind CSS
- **Backend:** Hono (@hono/node-server)

## 機能 (Features)

- リンクの表示・管理
- その他、旧 `linkpage` からの機能移行（順次実装予定。進捗は後日作成されるIssueで追跡予定）

## 環境構築 (Getting Started)

### 前提条件 (Prerequisites)

- Node.js (v20以上推奨)

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

### 開発サーバー起動 (Development)

Frontend (Vite) と Backend (Hono) を同時に起動します。

```bash
npm run dev
```

起動後、以下のURLでアクセスできます：

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3030`

### ビルド (Build)

```bash
npm run build
```

### テスト (Testing)

```bash
npm run test
```
