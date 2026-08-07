import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { BookmarkUrlSchema } from '../../functions/schemas/bookmark'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const validateUrl = (url: string) => {
  return BookmarkUrlSchema.safeParse(url)
}

export const createErrorMessage = (text: string) => {
  return { text, type: 'error' }
}
