import { render, screen } from '@testing-library/react'
import userEvent, { UserEvent } from '@testing-library/user-event'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'

import {
  INVALID_STRING,
  TestBookmarkWithKeywords,
  TestKeywords,
} from '../../../functions/test/fixtures'
import { UI_LABELS } from '../../../shared/constants/uiMessages'
import { SCHEMA_MESSAGE } from '../../../shared/constants/validation'
import { clickButton } from '../../test/test-utils'
import { KeywordPage } from './KeywordPage'

const mockBack = vi.fn()
const mockNavigate = vi.fn()

let mockHistoryLength = 2

vi.mock('@tanstack/react-router', () => ({
  Link: vi.fn(),
  useRouter: () => ({
    history: {
      back: mockBack,
      get length() {
        return mockHistoryLength
      },
    },
    navigate: mockNavigate,
  }),
}))

vi.mock('../keyword/useKeywords', () => ({
  useKeywords: () => {
    return { data: { data: TestKeywords, success: true } }
  },
}))

vi.mock('./useUpdateKeyword', () => ({
  useUpdateKeyword: () => ({ isPending: false, mutate: vi.fn() }),
}))

vi.mock('./useDeleteKeyword', () => ({
  useDeleteKeyword: () => ({ isPending: false, mutate: vi.fn() }),
}))

vi.mock('../relations/useAssignRelation', () => ({
  useAssignRelation: () => ({ isPending: false, mutate: vi.fn() }),
}))

vi.mock('../relations/useUnassignRelation', () => ({
  useUnassignRelation: () => ({ isPending: false, mutate: vi.fn() }),
}))

const mockUseBookmarks = vi.fn()
vi.mock('../bookmark/useBookmarks', () => ({
  useBookmarks: () => mockUseBookmarks(),
}))

describe('キーワードの詳細画面で「開く」ボタン', () => {
  let openSpy: Mock
  let user: UserEvent

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseBookmarks.mockReturnValue({
      data: { data: TestBookmarkWithKeywords, success: true },
    })
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    user = userEvent.setup()
  })

  describe('正常系', () => {
    it('「開く」ボタンをクリックすると関連付けられているブックマークを開く', async () => {
      const testKeyword = TestKeywords[0]
      render(<KeywordPage keyword={testKeyword} />)

      await clickButton(user, UI_LABELS.ACTIONS.OPEN)

      expect(openSpy).toHaveBeenCalledWith(
        TestBookmarkWithKeywords[0].url,
        '_blank',
        'noopener,noreferrer',
      )
    })
    it('関連付けられているブックマークが存在しない場合、「開く」ボタンが disabled になること', () => {
      const testKeyword = TestKeywords[1]
      render(<KeywordPage keyword={testKeyword} />)

      const openButton = screen.getByRole('button', {
        name: UI_LABELS.ACTIONS.OPEN,
      })
      expect(openButton).toBeDisabled()
    })
  })

  describe('異常系', () => {
    it('関連付けられているブックマークの URL が不正な場合、window.open は呼び出されず console.error が出力されること', async () => {
      // 不正な URL を持ったブックマークのモックデータ
      const bookmarkId = uuidv7()
      const testKeyword = {
        bookmark_ids: [bookmarkId],
        id: TestKeywords[0].id,
        name: TestKeywords[0].name,
      }
      const invalidBookmark = {
        id: bookmarkId,
        keywords: [{ id: testKeyword.id, name: testKeyword.name }],
        title: INVALID_STRING.NAME,
        url: INVALID_STRING.ID, // Schema で失敗する値
      }

      // useBookmarks が不正な URL を返すようにオーバーライド
      mockUseBookmarks.mockReturnValue({
        data: { data: [invalidBookmark], success: true },
      })

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      render(<KeywordPage keyword={testKeyword} />)

      await clickButton(user, UI_LABELS.ACTIONS.OPEN)

      // 不正な URL のため window.open は呼ばれない
      expect(openSpy).not.toHaveBeenCalled()
      // console.error が正しく呼ばれていること
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `${INVALID_STRING.NAME}: ${SCHEMA_MESSAGE.PROTOCOL_CONSTRAINT}`,
      )

      consoleErrorSpy.mockRestore()
    })
  })
})
