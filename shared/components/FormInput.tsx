import React, { useId } from 'react'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export const FormInput = ({
  className = '',
  id,
  label,
  type = 'text',
  ...props
}: FormInputProps) => {
  // idが指定されていなければユニークなIDを自動生成して label と input を紐付ける
  const inputId = id || useId()

  return (
    <>
      <label className="text-sm font-medium text-slate-600" htmlFor={inputId}>
        {label}
      </label>
      <input
        aria-label={label}
        className={`border border-slate-300 text-slate-700 bg-slate-200 rounded px-2 py-1 ${className}`}
        id={inputId}
        type={type}
        {...props}
      />
    </>
  )
}
