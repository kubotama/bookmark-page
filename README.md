# Bookmark Page

![CI](https://github.com/kubotama/bookmark-page/actions/workflows/ci.yml/badge.svg)

## 概要 (Overview)

個人的なブックマーク（リンク集）を管理・表示するためのWebアプリケーションです。

## 技術スタック (Tech Stack)

- **Frontend:** Vite, React, TypeScript, Tailwind CSS, TanStack Query
- **Backend:** Hono, Cloudflare Pages, TypeScript
- **Shared:** TypeScript (Zod schemas, domain types like BookmarkId, constants)
- **Database:** Cloudflare D1

## 機能 (Features)

- **ブックマーク一覧表示**: データベースから取得したブックマークを一覧表示。
- **ブックマークの詳細表示・編集画面**: 行を選択することで専用の詳細ページへ遷移します。
  **リンクの管理**: API 経由でのブックマーク追加、更新、削除に対応します。
- **ブラウザ拡張機能**: ブラウザから直接ブックマークを追加するための Chrome 拡張機能を提供します。
  - 開いているページのタイトルと URL を自動取得し、ワンクリックでブックマーク登録。

## 環境構築 (Getting Started)

### 前提条件 (Prerequisites)

- Node.js (v26.3.1以上必須)

### データベース (Database)

本プロジェクトでは **Cloudflare D1** を使用しています。

ローカル開発環境では、`wrangler` (Miniflare) によって D1 データベースがエミュレートされます。データベースの実体は `.wrangler` ディレクトリ内に保持されます。

### インストール (Installation)

```bash
npm install
```

### 開発サーバー起動 (Development)

#### Web アプリケーション

Frontend (Vite) と Backend (Hono) を同時に起動します。

```bash
npm run dev
```

起動後、以下のURLでアクセスできます（デフォルト設定の場合）：

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8788`

> [!TIP]
> **一括起動機能（Enterキー）が動作しない場合**
> 複数のキーワードを選択した状態で Enter キーを押してもブックマークが開かない場合、ブラウザの「ポップアップブロック」機能によって制限されている可能性があります。その場合は、ブラウザの設定で本アプリのURL（例: `http://localhost:5173`）からの **「ポップアップとリダイレクト」を許可** してください。

### ビルド (Build)

#### Web アプリケーション

```bash
npm run build
```

#### ブラウザ拡張機能

```bash
npm run build:extension
```

ビルド成果物は `extension/dist-extension` に出力されます。Chrome の `chrome://extensions/` から「パッケージ化されていない拡張機能を読み込む」でこのディレクトリを選択してインストールしてください。

#### ページのブックマーク登録

1. ブックマークしたいページを開いた状態で、ツールバーの拡張機能アイコンをクリックします。
2. ポップアップが表示され、現在のページのタイトルと URL が自動的に入力されます。
3. APIのURLに、ブックマークの一覧画面のURLを入力します。
4. APIのURLを保存ボタンをクリックして、APIのURLを保存します。
5. APIのURLを検証ボタンをクリックして、APIのURLが正しく入力されていることを確認します。正しく入力されている場合には、登録済みのブックマークの件数が表示されます。
6. 「保存する」ボタンをクリックすると、サーバーにブックマークが登録されます。

### コーディング規約チェック

プロジェクト全体のコーディング規約チェックを実行します。

```bash
npm run lint
```

### 型チェック (Type Check)

プロジェクト全体の型チェックを実行します。

```bash
npm run typecheck
```

### テスト (Testing)

プロジェクト全体で Vitest を使用した自動テストを実施しています。

#### テストの実行

- **全レイヤー（Web/Server/Extension）**: `npm run test`
- **カバレッジの確認**: `npm run test:coverage`
