// src/routes/index.tsx
import { createFileRoute, Link } from '@tanstack/react-router'

import { UI_LABELS } from '../../shared/constants/uiMessages'

export const Route = createFileRoute('/')({
  component: IndexComponent,
})

function IndexComponent() {
  return (
    <nav className="mt-5 flex flex-col items-center gap-5 text-lg">
      <Link
        className="inline-block hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
        to="/bookmark"
      >
        {UI_LABELS.NAVIGATION.BOOKMARK}
      </Link>
      <Link
        className="inline-block hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
        to="/keyword"
      >
        {UI_LABELS.NAVIGATION.KEYWORD}
      </Link>
    </nav>
  )
  /* v8 ignore start */
}
/* v8 ignore stop */
