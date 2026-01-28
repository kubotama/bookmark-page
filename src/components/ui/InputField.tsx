import React from 'react'

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  id: string
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  id,
  className = '',
  ...props
}) => {
  return (
    <div className="flex items-center gap-4">
      <label
        htmlFor={id}
        className="w-8 text-xs font-medium text-gray-500 uppercase tracking-wider"
      >
        {label}
      </label>
      <input
        id={id}
        className={`flex-1 px-2 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${className}`}
        {...props}
      />
    </div>
  )
}
