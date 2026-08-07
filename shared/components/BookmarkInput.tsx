import { UI_LABELS } from '../constants/uiMessages'
import { FormInput } from './FormInput'

interface BookmarkInputProps {
  title: string
  setTitle: (value: React.SetStateAction<string>) => void
  url: string
  setUrl: (value: React.SetStateAction<string>) => void
}

export const BookmarkInput = (bookmarkInputProps: BookmarkInputProps) => {
  return (
    <div className="grid grid-cols-[max-content_1fr] items-center gap-1">
      <FormInput
        id="title-input"
        label={UI_LABELS.FIELDS.TITLE}
        onChange={(e) => bookmarkInputProps.setTitle(e.target.value)}
        value={bookmarkInputProps.title}
      />
      <FormInput
        id="url-input"
        label={UI_LABELS.FIELDS.URL}
        onChange={(e) => bookmarkInputProps.setUrl(e.target.value)}
        value={bookmarkInputProps.url}
      />
    </div>
  )
}
