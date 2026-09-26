export type TestCase = {
  errorName: string
  status?: number
  params?: { bookmark_id: string; keyword_id: string }
  payload?: { error?: string; success: boolean }
}
