import { createRootRoute, Outlet } from '@tanstack/react-router'
import { UI_LABELS } from '../../shared/constants/uiMessages'

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* 必要であればここにヘッダーなどを共通配置 */}
      <div className="text-slate-200 bg-slate-700 font-bold w-1/2 m-auto text-center text-xl p-2 mb-2 mt-2">
        {UI_LABELS.HEADER.PAGE_HEADER}
      </div>

      <main className="container mx-auto">
        <Outlet />
      </main>
    </div>
  ),
})
