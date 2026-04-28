import { Hono } from 'hono'
import { createBezzie, providers, cloudflareKV } from 'bezzie'

export interface Env {
  SESSION_KV: KVNamespace
  AUTH0_CLIENT_ID: string
  AUTH0_CLIENT_SECRET: string
  AUTH0_AUDIENCE: string
  APP_BASE_URL: string
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const auth = createBezzie({
      ...providers.auth0(new URL(env.APP_BASE_URL).hostname),
      clientId: env.AUTH0_CLIENT_ID,
      clientSecret: env.AUTH0_CLIENT_SECRET,
      audience: env.AUTH0_AUDIENCE,
      adapter: cloudflareKV(env.SESSION_KV),
      baseUrl: env.APP_BASE_URL,
    })

    const app = new Hono<{ Bindings: Env }>()
    app.route('/auth', auth.routes())
    app.get('/api/me', auth.middleware(), (c) => c.json(c.var.user))

    return app.fetch(request, env, ctx)
  }
}
