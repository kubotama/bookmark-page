import { render, screen, within } from '@testing-library/react'
import { ComponentProps, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  TestBookmarkWithKeywords,
  TestKeywords,
} from '../../../functions/test/fixtures'
import { UI_LABELS } from '../../../shared/constants/uiMessages'
import { KeywordPage } from './KeywordPage'

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

vi.mock('./useDeleteKeyword', () => ({
  useDeleteKeyword: () => ({ isPending: false, mutate: vi.fn() }),
}))

vi.mock('./useUpdateKeyword', () => ({
  useUpdateKeyword: () => ({ isPending: false, mutate: vi.fn() }),
}))

vi.mock('./useKeywords', () => ({
  useKeywords: () => ({ data: { data: [] } }),
}))

const mockUseBookmarks = vi.fn()
vi.mock('../bookmark/useBookmarks', () => ({
  useBookmarks: () => mockUseBookmarks(),
}))

describe('KeywordPages - ブックマーク表示', () => {
  const targetKeyword = TestKeywords[0]

  beforeEach(() => {
    vi.resetAllMocks()
    // 全ブックマークとして TestBookmarkWithKeywords を返すように設定
    mockUseBookmarks.mockReturnValue({
      data: { data: TestBookmarkWithKeywords, success: true },
    })
  })

  it('関連付けられているキーワードが正しいエリアに表示されること', async () => {
    render(<KeywordPage keyword={targetKeyword} />)

    // 💡 1. 見出しテキストからそれぞれの「エリア（親要素）」を特定する
    const assignedSection = screen.getByText(
      UI_LABELS.FIELDS.ASSIGNED_BOOKMARK,
    ).parentElement!
    const unassignedSection = screen.getByText(
      UI_LABELS.FIELDS.UNASSIGNED_BOOKMARK,
    ).parentElement!

    // 💡 2. 「関連付けられているキーワード」エリアの検証
    // -> 「キーワード1」は存在し、「キーワード2」は存在しないこと
    const assignedLinks = within(assignedSection).getAllByRole('link')
    expect(assignedLinks).toHaveLength(1)
    expect(
      within(assignedSection).getByText(TestBookmarkWithKeywords[0].title),
    ).toBeInTheDocument()
    expect(
      within(assignedSection).queryByText(TestBookmarkWithKeywords[1].title),
    ).not.toBeInTheDocument()

    // 💡 3. 「関連付けられていないキーワード」エリアの検証
    // -> 「キーワード2」は存在し、「キーワード1」は存在しないこと
    const unassignedLinks = within(unassignedSection).getAllByRole('link')
    expect(unassignedLinks).toHaveLength(2)
    expect(
      within(unassignedSection).queryByText(TestBookmarkWithKeywords[0].title),
    ).not.toBeInTheDocument()
    expect(
      within(unassignedSection).getByText(TestBookmarkWithKeywords[1].title),
    ).toBeInTheDocument()
  })
})
