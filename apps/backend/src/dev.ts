import { serve } from '@hono/node-server'
import 'dotenv/config'

import { app } from './app.js'

const PORT = Number(process.env.PORT ?? 3001)

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Backend running on http://localhost:${info.port}`)
})
