import { Link } from '@tanstack/react-router'
import { ReactNode } from 'react'

import { UI_LABELS } from '../../shared/constants/uiMessages'

type ListItemProps = {
  children: ReactNode
  id: string
  openHref?: string
  openLabel?: string
  to: string
}

export const ListItem = ({
  children,
  id,
  openHref,
  openLabel = UI_LABELS.ACTIONS.OPEN,
  to,
}: ListItemProps) => {
  return (
    <div
      className="relative w-full p-2 text-slate-700 bg-slate-200 border border-slate-300 hover:bg-indigo-200 flex justify-between items-center"
      key={id}
    >
      <Link
        className="hover:font-semibold flex-1 text-left after:absolute after:inset-0"
        params={{ id }}
        to={to}
      >
        {children}
      </Link>
      {openHref ? (
        <a
          className="relative z-10 text-shadow-xs text-indigo-400 hover:text-indigo-800 hover:underline hover:font-bold ml-2"
          href={openHref}
          rel="noreferrer"
          target="_blank"
        >
          {openLabel}
        </a>
      ) : (
        ''
      )}
    </div>
  )
}
