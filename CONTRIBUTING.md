# 開発ガイドライン & 運用ルール

このプロジェクトのブランチ運用、Issue/PRの作成、コミットルールについてのまとめです。

---

## 1. 開発フロー（GitHub Flow ベース）

1. `main` ブランチから作業用ブランチを作成
2. ローカルで実装・テスト（Vitest）を実行
3. Draft PR を作成して開発を進める（必要に応じて）
4. 実装完了後、セルフレビューを行い `main` へ **Squash & Merge**

---

## 2. Issue の運用ルール

- **基本方針:** 即時着手する小さな変更やリファクタリングは Issue 不要（PR 直接作成）。
- **Issue を作成する場合:**
  - 後から着手するタスクのメモ
  - 思考を整理したい大きな設計変更
- **テンプレートの使い分け:**
  - **Feature:** 通常の機能追加・改善
  - **Bug:** 不具合の報告と再現手順
  - **Design / Proposal:** アーキテクチャ変更やDB構造変更などの大掛かりな設計検討

---

## 3. ブランチ命名規則

`カテゴリ/簡潔な概要` または `カテゴリ/#Issue番号-簡潔な概要` の形式を使用します。

- `feature/` : 機能追加・UI実装（例: `feature/d1-schema-update`）
- `fix/` : バグ修正（例: `fix/hono-cors-error`）
- `refactor/` : コード整理・リファクタリング（例: `refactor/tanstack-query-hooks`）
- `docs/` : ドキュメント調整（例: `docs/update-readme`）
- `chore/` : CI設定、テンプレート追加、依存関係更新（例: `chore/add-issue-templates`）

---

## 4. プルリクエスト (PR) の運用ルール

- **作成タイミング:** ブランチ作成後の初期コミット時点で **Draft PR** を作成（WIP管理）。
- **Issue 連携:** 関連 Issue がある場合は概要に `Closes #Issue番号` を明記。
- **マージ方法:** 原則 **Squash and Merge** を使用。

---

## 5. Squash コミットメッセージのフォーマット

`main` にマージする際のコミットメッセージは以下の形式に揃えます。

```text
<type>: <要約> (#<Issue番号>)

- <変更点 1>
- <変更点 2>

<補足・設計上の理由（Why）>
```

### Type 一覧

- feat: 機能追加
- fix: バグ修正
- refactor: リファクタリング
- chore: 設定変更・ツール整備・依存関係更新
- docs: ドキュメント修正

## 6. ローカル品質チェックコマンド

`Push` / マージ前に以下のコマンドが通ることを確認します。

```bash
# lint
npm run lint

# 型チェック
npm run typecheck

# 単体テスト実行
npm run test
```
