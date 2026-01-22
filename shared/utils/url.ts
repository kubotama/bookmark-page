/**
 * URL が http:// または https:// で始まっているかを確認する
 */
export const isHttpUrl = (url: string): boolean => {
  return /^https?:\/\//.test(url)
}
