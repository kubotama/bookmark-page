import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import {
  KeywordNameSchema,
  KeywordWithBookmarkIds,
} from '../../../functions/schemas/keyword'
import { Button } from '../../../shared/components/Button'
import { FormInput } from '../../../shared/components/FormInput'
import { UI_LABELS, UI_MESSAGES } from '../../../shared/constants/uiMessages'
import { ListItem } from '../../components/ListItem'
import { isRegisteredKeyword } from '../../lib/keywords'
import { useBookmarks } from '../bookmark/useBookmarks'
import { useDeleteKeyword } from './useDeleteKeyword'
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
  const { isPending: isDeletePending, mutate: deleteKeyword } =
    useDeleteKeyword()
  const { data: bookmarkData } = useBookmarks()
  const bookmarks = bookmarkData?.data ?? []

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

  const handleDelete = () => {
    // ユーザーへの最終確認（誤操作防止）
    const isConfirmed = window.confirm(
      UI_MESSAGES.KEYWORDS.CONFIRM_DELETE(keyword.name),
    )

    if (isConfirmed) {
      // バリデーション済みのIDを渡してAPI実行をトリガー
      deleteKeyword(keyword.id)
    }
  }

  const bookmarksIdSet = new Set(keyword.bookmark_ids)
  const { assignedBookmarks, unassignedBookmarks } = bookmarks.reduce<{
    assignedBookmarks: typeof bookmarks
    unassignedBookmarks: typeof bookmarks
  }>(
    (acc, b) => {
      if (bookmarksIdSet.has(b.id)) {
        acc.assignedBookmarks.push(b)
      } else {
        acc.unassignedBookmarks.push(b)
      }
      return acc
    },
    { assignedBookmarks: [], unassignedBookmarks: [] },
  )

  return (
    <>
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
          <Button
            disabled={isDisableUpdate}
            onClick={handleUpdate}
            type="button"
          >
            {labelUpdate}
          </Button>
          <Button
            disabled={isDeletePending}
            onClick={handleDelete}
            type="button"
          >
            {UI_LABELS.ACTIONS.DELETE}
          </Button>
          <Button disabled={isBackDisable} onClick={handleBack} type="button">
            {UI_LABELS.ACTIONS.BACK}
          </Button>
        </div>
      </form>

      <div className="mt-5">
        <div className="text-sm">{UI_LABELS.FIELDS.ASSIGNED_BOOKMARK}</div>
        <div className="border-2 border-slate-500 min-h-10 rounded">
          <div className="w-full transition">
            <div className="flex flex-col items-start">
              {assignedBookmarks.map((b) => (
                <ListItem id={b.id} key={b.id} to={`/bookmark/${b.id}`}>
                  {b.title}
                </ListItem>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-sm">{UI_LABELS.FIELDS.UNASSIGNED_BOOKMARK}</div>
        <div className="border-2 border-slate-500 min-h-10 rounded">
          <div className="w-full transition">
            <div className="flex flex-col items-start">
              {unassignedBookmarks.map((b) => (
                <ListItem id={b.id} key={b.id} to={`/bookmark/${b.id}`}>
                  {b.title}
                </ListItem>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
