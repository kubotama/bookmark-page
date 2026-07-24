import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { showErrorMessage } from './notification'
import { TEST_ERROR_MESSAGE } from '../../functions/test/fixtures'

describe('メッセージ表示', () => {
  let alertSpy: Mock<(message?: unknown) => void>

  beforeEach(() => {
    vi.resetAllMocks()
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {}) // alertのポップアップを抑制
  })

  it('showErrorMessage', () => {
    showErrorMessage(TEST_ERROR_MESSAGE.API_ERROR)
    expect(alertSpy).toHaveBeenCalledWith(TEST_ERROR_MESSAGE.API_ERROR)
  })
})
