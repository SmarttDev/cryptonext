import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'

import { eventsRouter } from './routes/events.js'
import { statsRouter } from './routes/stats.js'

export function createApp() {
  const app = new Hono()

  if (
    process.env.NODE_ENV !== 'test' &&
    process.env.NODE_ENV !== 'production'
  ) {
    app.use('*', logger())
  }

  app.use(
    '*',
    cors({
      origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
      allowMethods: ['GET', 'OPTIONS'],
    })
  )

  app.route('/events', eventsRouter)
  app.route('/stats', statsRouter)

  app.get('/health', (c) =>
    c.json({ status: 'ok', timestamp: new Date().toISOString() })
  )

  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json({ error: err.message }, err.status)
    }
    console.error(err)
    return c.json({ error: 'Internal server error' }, 500)
  })

  return app
}

export const app = createApp()
