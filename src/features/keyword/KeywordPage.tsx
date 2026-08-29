import { useState } from 'react'

import { KeywordWithBookmarkIds } from '../../../functions/schemas/keyword'
import { FormInput } from '../../../shared/components/FormInput'
import { UI_LABELS } from '../../../shared/constants/uiMessages'

interface KeywordPageProps {
  keyword: KeywordWithBookmarkIds
}

export const KeywordPage = ({ keyword }: KeywordPageProps) => {
  const [keywordName, setKeywordName] = useState<string>(keyword.name)

  return (
    <div className="grid grid-cols-[max-content_1fr] items-center gap-1">
      <FormInput
        label={UI_LABELS.FIELDS.KEYWORD_NAME}
        onChange={(e) => setKeywordName(e.target.value)}
        value={keywordName}
      />
    </div>
  )
}
