import { useRouter } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

import {
  BookmarkUrlSchema,
  BookmarkWithKeywords,
  UpdateBookmarkSchema,
} from '../../functions/schemas/bookmark'
import { KeywordWithBookmarkIds } from '../../functions/schemas/keyword'
import { Button } from '../../shared/components/Button'
import { FormInput } from '../../shared/components/FormInput'
import { UI_LABELS, UI_MESSAGES } from '../../shared/constants/uiMessages'
import { useAddKeyword } from '../hooks/useAddKeyword'
import { useDeleteBookmark } from '../hooks/useDeleteBookmark'
import { useKeywords } from '../hooks/useKeywords'
import { useUpdateBookmark } from '../hooks/useUpdateBookmark'
import { ListItem } from './ListItem'

interface BookmarkFormProps {
  bookmark: BookmarkWithKeywords
}

export const BookmarkForm = ({ bookmark }: BookmarkFormProps) => {
  const [title, setTitle] = useState(bookmark.title)
  const [url, setUrl] = useState(bookmark.url)
  const [keywordName, setKeywordName] = useState<string>('')
  const router = useRouter()
  const { isPending, mutate: deleteBookmark } = useDeleteBookmark()
  const { isPending: isUpdatePending, mutate: updateBookmark } =
    useUpdateBookmark()
  const { isPending: isAddKeywordPending, mutate: addKeyword } = useAddKeyword()

  const isSubmitDisable = !BookmarkUrlSchema.safeParse(url).success
  const isDirty = bookmark.title !== title.trim() || bookmark.url !== url.trim()
  const canUpdate =
    isDirty && UpdateBookmarkSchema.safeParse({ title, url }).success
  const isUpdateDisable = !canUpdate || isUpdatePending
  const isBackDisable = router.history.length < 2

  const { data } = useKeywords() // 💡 呼ぶだけ
  const keywords = data?.data ?? []

  const unassignedKeywords = useMemo<KeywordWithBookmarkIds[]>(() => {
    return keywords.filter(
      (keyword) => !bookmark.keywords.some((k) => k.id === keyword.id),
    )
  }, [bookmark, keywords])

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    window.open(url, '_blank', 'noreferrer')
  }

  const handleBack = () => {
    router.history.back()
  }

  const handleDelete = () => {
    // ユーザーへの最終確認（誤操作防止）
    const isConfirmed = window.confirm(
      UI_MESSAGES.BOOKMARKS.CONFIRM_DELETE(bookmark.title),
    )

    if (isConfirmed) {
      // バリデーション済みのIDを渡してAPI実行をトリガー
      deleteBookmark(bookmark.id)
    }
  }

  const handleUpdate = () => {
    updateBookmark({
      id: bookmark.id,
      title,
      url,
    })
  }

  const handleAddKeyword = () => {
    addKeyword(
      { bookmark_id: bookmark.id, name: keywordName },
      {
        onSuccess: () => {
          setKeywordName('')
        },
      },
    )
  }

  // const isDisableAddkeyword = isAddKeywordPending || keywordName === ''

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-[max-content_1fr] items-center gap-1">
          <FormInput
            label={UI_LABELS.FIELDS.TITLE}
            onChange={(e) => setTitle(e.target.value)}
            value={title}
          />
          <FormInput
            label={UI_LABELS.FIELDS.URL}
            onChange={(e) => setUrl(e.target.value)}
            value={url}
          />
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2">
          <Button disabled={isSubmitDisable} type="submit">
            {UI_LABELS.ACTIONS.OPEN}
          </Button>
          <Button
            disabled={isUpdateDisable}
            onClick={handleUpdate}
            type="button"
          >
            {UI_LABELS.ACTIONS.UPDATE}
          </Button>
          <Button disabled={isPending} onClick={handleDelete} type="button">
            {UI_LABELS.ACTIONS.DELETE}
          </Button>
          <Button disabled={isBackDisable} onClick={handleBack} type="button">
            {UI_LABELS.ACTIONS.BACK}
          </Button>
        </div>
      </form>

      <div className="mt-4 grid grid-cols-[max-content_1fr_max-content] items-center gap-3">
        <FormInput
          label={UI_LABELS.FIELDS.ADD_KEYWORD}
          onChange={(e) => setKeywordName(e.target.value)}
          value={keywordName}
        />
        <Button
          disabled={isAddKeywordPending || keywordName === ''}
          onClick={handleAddKeyword}
        >
          {UI_LABELS.ACTIONS.ADD_KEYWORD}
        </Button>
      </div>

      <div className="mt-5">
        <div className="text-sm">{UI_LABELS.FIELDS.ASSIGNED_KEYWORD}</div>
        <div className="border-2 border-slate-500 min-h-10 rounded">
          <div className="w-full transition">
            <div className="flex flex-col items-start">
              {bookmark.keywords.map((keyword) => (
                <ListItem
                  id={keyword.id}
                  key={keyword.id}
                  to={`/bookmark/${keyword.id}`}
                >
                  {keyword.name}
                </ListItem>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-sm">{UI_LABELS.FIELDS.UNASSIGNED_KEYWORD}</div>
        <div className="border-2 border-slate-500 min-h-10 rounded">
          <div className="w-full transition">
            <div className="flex flex-col items-start">
              {unassignedKeywords.map((keyword) => (
                <ListItem
                  id={keyword.id}
                  key={keyword.id}
                  to={`/bookmark/${keyword.id}`}
                >
                  {keyword.name}
                </ListItem>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
