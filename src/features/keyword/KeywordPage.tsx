import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import {
  KeywordNameSchema,
  KeywordWithBookmarkIds,
} from '../../../functions/schemas/keyword'
import { Button } from '../../../shared/components/Button'
import { FormInput } from '../../../shared/components/FormInput'
import { UI_LABELS } from '../../../shared/constants/uiMessages'
import { isRegisteredKeyword } from '../../lib/keywords'
import { useKeywords } from './useKeywords'
import { useUpdateKeyword } from './useUpdateKeyword'

interface KeywordPageProps {
  keyword: KeywordWithBookmarkIds
}

export const KeywordPage = ({ keyword }: KeywordPageProps) => {
  const [keywordName, setKeywordName] = useState<string>(keyword.name)
  const router = useRouter()
  const { data } = useKeywords() // 💡 呼ぶだけ
  const keywords = data?.data ?? []
  const { isPending: isUpdatePending, mutate: updateKeyword } =
    useUpdateKeyword()

  const isBackDisable = router.history.length < 2

  const handleBack = () => {
    router.history.back()
  }

  const handleUpdate = () => {
    updateKeyword({ id: keyword.id, name: keywordName })
  }

  const isDuplicateKeyword = isRegisteredKeyword(keywords, keywordName)
  const isInvalidKeyword = !KeywordNameSchema.safeParse(keywordName).success
  const isDisableUpdate =
    isDuplicateKeyword || isUpdatePending || isInvalidKeyword

  const labelUpdate = isDuplicateKeyword
    ? UI_LABELS.ACTIONS.KEYWORD_REGISTERED
    : UI_LABELS.ACTIONS.UPDATE

  return (
    <form>
      <div className="grid grid-cols-[max-content_1fr] items-center gap-1">
        <FormInput
          label={UI_LABELS.FIELDS.KEYWORD_NAME}
          onChange={(e) => setKeywordName(e.target.value)}
          value={keywordName}
        />
      </div>
      <div className="mt-2 grid grid-cols-4 gap-2">
        <Button disabled type="submit">
          {UI_LABELS.ACTIONS.OPEN}
        </Button>
        <Button disabled={isDisableUpdate} onClick={handleUpdate} type="button">
          {labelUpdate}
        </Button>
        <Button disabled type="button">
          {UI_LABELS.ACTIONS.DELETE}
        </Button>
        <Button disabled={isBackDisable} onClick={handleBack} type="button">
          {UI_LABELS.ACTIONS.BACK}
        </Button>
      </div>
    </form>
  )
}
