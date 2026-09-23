import { Link } from '@tanstack/react-router'
import { ReactNode } from 'react'

import { UI_LABELS } from '../../shared/constants/uiMessages'

type ListItemProps = React.HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  detailLabel?: string
  id: string
  openHref?: string
  to: string
}

export const ListItem = ({
  children,
  detailLabel = UI_LABELS.ACTIONS.DETAIL,
  id,
  openHref,
  to,
  ...props
}: ListItemProps) => {
  return (
    <div
      className="w-full p-2 text-slate-700 bg-slate-200 border border-slate-300 hover:bg-indigo-200 flex justify-between items-center"
      {...props}
    >
      {openHref ? (
        <a
          className="hover:font-semibold hover:underline text-left"
          href={openHref}
          rel="noreferrer"
          target="_blank"
        >
          {children}
        </a>
      ) : (
        <>{children}</>
      )}

      <Link
        className="text-shadow-xs text-indigo-400 hover:text-indigo-800 hover:underline hover:font-bold ml-2"
        params={{ id }}
        to={to}
      >
        {detailLabel}
      </Link>
    </div>
  )
}
