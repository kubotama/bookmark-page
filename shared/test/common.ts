export type TestCase = {
  errorName: string
  status?: number
  payload?: { error?: string; success: boolean }
}
