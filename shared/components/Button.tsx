import { cn } from '../lib/utils'

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, className, ...props }) => {
  return (
    <button
      className={cn(
        `border border-slate-300 text-slate-700 bg-indigo-200 rounded px-2 py-1 cursor-pointer
            hover:text-slate-200 hover:bg-indigo-700 hover:font-semibold
            disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed`,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
