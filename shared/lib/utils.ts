import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { BookmarkUrlSchema } from '../../functions/schemas/bookmark'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const validateUrl = (url: string) => {
  return BookmarkUrlSchema.safeParse(url)
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    // エラーの名前をクラス名と一致させる
    this.name = 'ValidationError'
  }
}
