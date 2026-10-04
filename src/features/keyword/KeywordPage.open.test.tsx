import { render, screen } from '@testing-library/react'
import userEvent, { UserEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'

import {
  TestBookmarkWithKeywords,
  TestKeywords,
} from '../../../functions/test/fixtures'
import { UI_LABELS } from '../../../shared/constants/uiMessages'
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
  useUnassignRelation: () => ({
    isPending: false,
    mutate: vi.fn(),
  }),
}))

vi.mock('../bookmark/useBookmarks', () => ({
  useBookmarks: () => {
    return { data: { data: TestBookmarkWithKeywords, success: true } }
  },
}))

describe('キーワードの詳細画面で「開く」ボタン', () => {
  let openSpy: Mock
  let user: UserEvent

  beforeEach(() => {
    vi.clearAllMocks()
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    user = userEvent.setup()
  })

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
