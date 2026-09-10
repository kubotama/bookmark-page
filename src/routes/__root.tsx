import { createRootRoute, Link, Outlet } from '@tanstack/react-router'

import { UI_LABELS } from '../../shared/constants/uiMessages'

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen px-2 bg-slate-50 text-slate-900">
      {/* 必要であればここにヘッダーなどを共通配置 */}
      <div className="relative text-slate-200 bg-slate-700 font-bold w-full xl:w-1/2 mx-auto text-center text-xl p-2 mb-2 mt-2">
        {/* 中央のタイトル */}
        <Link to="/">{UI_LABELS.HEADER.PAGE_HEADER}</Link>

        {/* 右端に配置するリンク */}
        <Link
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-200 text-sm font-normal hover:underline"
          to="/keyword"
        >
          {UI_LABELS.HEADER.KEYWORD}
        </Link>
      </div>
      <main className="w-full xl:w-1/2 mx-auto">
        <Outlet />
      </main>
    </div>
  ),
  /* v8 ignore start */
})
/* v8 ignore stop */
