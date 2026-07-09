export const LOG_MESSAGE = {
  DB_ERROR: (message: unknown) => `database error: ${message}`,
  MANIFEST_COPY_ERROR: (error: unknown) => `Manifest copy failed: ${error}`,
} as const
