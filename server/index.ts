import { serve } from '@hono/node-server'
import app from './app'
import { initializeDatabase } from './db'
import { LOG_MESSAGES } from '@shared/constants'

const port = 3030

try {
  initializeDatabase()
  console.log('Database initialized successfully')
} catch (error) {
  console.error(LOG_MESSAGES.SERVER_START_FAILED, error)
  process.exit(1)
}

console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})