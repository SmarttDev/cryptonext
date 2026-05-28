import 'dotenv/config'
import { handle } from 'hono/vercel'

import { app } from '../src/app'

export const config = {
  runtime: 'nodejs24.x',
}

export default handle(app)
