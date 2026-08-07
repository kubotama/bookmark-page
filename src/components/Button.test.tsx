import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TEST_STRING } from '../../functions/test/fixtures'
import { Button } from '../../shared/components/Button'
import { clickButton } from '../test/test-utils'

describe('Button', () => {
  it('クリックするとonClickに割り当てた関数が呼び出される', async () => {
    const user = userEvent.setup()
    const mockFn = vi.fn()
    render(<Button onClick={mockFn}>{TEST_STRING.BUTTON_LABEL}</Button>)
    await clickButton(user, TEST_STRING.BUTTON_LABEL)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
})
