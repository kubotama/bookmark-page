import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import {
  Bookmark,
  BookmarkUrlSchema,
  UpdateBookmarkSchema,
} from '../../functions/schemas/bookmark'
import { Button } from '../../shared/components/Button'
import { FormInput } from '../../shared/components/FormInput'
import { UI_LABELS, UI_MESSAGES } from '../../shared/constants/uiMessages'
import { useDeleteBookmark } from '../hooks/useDeleteBookmark'
import { useUpdateBookmark } from '../hooks/useUpdateBookmark'

interface BookmarkFormProps {
  bookmark: Bookmark
}

export const BookmarkForm = ({ bookmark }: BookmarkFormProps) => {
  const [title, setTitle] = useState(bookmark.title)
  const [url, setUrl] = useState(bookmark.url)
  const router = useRouter()
  const { isPending, mutate: deleteBookmark } = useDeleteBookmark()
  const { isPending: isUpdatePending, mutate: updateBookmark } =
    useUpdateBookmark()

  const isSubmitDisable = !BookmarkUrlSchema.safeParse(url).success
  const isDirty = bookmark.title !== title.trim() || bookmark.url !== url.trim()
  const canUpdate =
    isDirty && UpdateBookmarkSchema.safeParse({ title, url }).success
  const isUpdateDisable = !canUpdate || isUpdatePending
  const isBackDisable = router.history.length < 2

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

  return (
    <form onSubmit={handleSubmit}>
      <div className="w-1/2 m-auto">
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
      </div>
    </form>
  )
}
