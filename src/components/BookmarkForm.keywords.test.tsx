// src/components/BookmarkForm.keyword.test.tsx
import type { ComponentProps, ReactNode } from 'react'

import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  TestBookmarkWithKeywords,
  TestKeywords,
} from '../../functions/test/fixtures'
import { UI_LABELS } from '../../shared/constants/uiMessages'
import { expectText } from '../test/test-utils'
import { BookmarkForm } from './BookmarkForm'

// 💡 1. Router の Link をモック化（ListItem 内で使用されるため）
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    ...props
  }: ComponentProps<'a'> & {
    children?: ReactNode
    params?: Record<string, string>
    to?: string
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ history: { back: vi.fn() }, navigate: vi.fn() }),
}))

// 💡 2. useKeywords フックのモック化（全キーワード一覧を返却）
const mockUseKeywords = vi.fn()
vi.mock('../hooks/useKeywords', () => ({
  useKeywords: () => mockUseKeywords(),
}))

vi.mock('../hooks/useDeleteBookmark', () => ({
  useDeleteBookmark: () => ({ isPending: false, mutate: vi.fn() }),
}))

vi.mock('../hooks/useUpdateBookmark', () => ({
  useUpdateBookmark: () => ({ isPending: false, mutate: vi.fn() }),
}))

describe('BookmarkForm - キーワード表示', () => {
  const targetBookmark = TestBookmarkWithKeywords[0]

  beforeEach(() => {
    vi.resetAllMocks()
    // 全キーワードとして TestKeywords を返すように設定
    mockUseKeywords.mockReturnValue({
      data: { data: TestKeywords, success: true },
    })
  })

  it('関連付けられているキーワードが正しいエリアに表示されること', async () => {
    // キーワード1 のみが関連付けられているブックマークデータ
    render(<BookmarkForm bookmark={targetBookmark} />)

    // await waitFor(() => {
    // 💡 1. 見出しテキストからそれぞれの「エリア（親要素）」を特定する
    const assignedSection = screen.getByText(
      UI_LABELS.FIELDS.ASSIGNED_KEYWORD,
    ).parentElement!
    const unassignedSection = screen.getByText(
      UI_LABELS.FIELDS.UNASSIGNED_KEYWORD,
    ).parentElement!

    // 💡 2. 「関連付けられているキーワード」エリアの検証
    // -> 「キーワード1」は存在し、「キーワード2」は存在しないこと
    const assignedLinks = within(assignedSection).getAllByRole('link')
    expect(assignedLinks).toHaveLength(1)
    expect(
      within(assignedSection).getByText(TestKeywords[0].name),
    ).toBeInTheDocument()
    expect(
      within(assignedSection).queryByText(TestKeywords[1].name),
    ).not.toBeInTheDocument()

    // 💡 3. 「関連付けられていないキーワード」エリアの検証
    // -> 「キーワード2」は存在し、「キーワード1」は存在しないこと
    const unassignedLinks = within(unassignedSection).getAllByRole('link')
    expect(unassignedLinks).toHaveLength(1)
    expect(
      within(unassignedSection).queryByText(TestKeywords[0].name),
    ).not.toBeInTheDocument()
    expect(
      within(unassignedSection).getByText(TestKeywords[1].name),
    ).toBeInTheDocument()
    // })
  })

  describe('キーワードの登録', () => {
    it('登録ボタンの表示', async () => {
      render(<BookmarkForm bookmark={targetBookmark} />)

      await expectText({ text: UI_LABELS.FIELDS.ADD_KEYWORD })
      await expectText({ text: UI_LABELS.ACTIONS.ADD_KEYWORD })
    })
  })
})
