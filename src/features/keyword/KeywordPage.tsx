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
import { useAssignRelation } from '../relations/useAssignRelation'
import { useDragItem } from '../relations/useDragItem'
import { useDropTarget } from '../relations/useDropTarget'
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
  const { handleDragStart } = useDragItem()
  const {
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    isOverAssigned,
  } = useDropTarget()
  const { isPending: isAssignRelationPending, mutate: assignRelation } =
    useAssignRelation()
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
        <div
          className={`flex flex-col items-start border-2 border-slate-500 min-h-10 rounded transition ${
            // 💡 ドラッグ要素が重なったときに枠線と背景をハイライト
            isOverAssigned
              ? 'border-indigo-500 bg-indigo-50/50'
              : 'border-slate-500'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={(e) =>
            handleDrop(e, (bookmark_id) => {
              if (!isAssignRelationPending)
                assignRelation({ bookmark_id, keyword_id: keyword.id })
            })
          }
        >
          {assignedBookmarks.map((b) => (
            <ListItem id={b.id} key={b.id} to={`/bookmark/${b.id}`}>
              {b.title}
            </ListItem>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-sm">{UI_LABELS.FIELDS.UNASSIGNED_BOOKMARK}</div>
        <div className="flex flex-col items-start min-h-10 border-2 border-slate-500 rounded transition">
          {unassignedBookmarks.map((b) => (
            <ListItem
              data-testid="unassigned-bookmark-item"
              draggable
              id={b.id}
              key={b.id}
              onDragStart={(e) => handleDragStart(e, b.id)}
              to={`/bookmark/${b.id}`}
            >
              {b.title}
            </ListItem>
          ))}
        </div>
      </div>
    </>
  )
}
