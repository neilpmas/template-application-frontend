import { Hono } from 'hono'
import { createBezzie, providers, cloudflareKVAdapter, type OptionalVariables } from 'bezzie'
import { createClient } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-web'
import { TemplateService } from '@template/proto'
import { workersFetch } from './lib/workersFetch'
import { log } from './lib/log'

export interface Env {
  SESSION_KV: KVNamespace
  AUTH0_CLIENT_ID: string
  AUTH0_CLIENT_SECRET: string
  AUTH0_AUDIENCE: string
  APP_BASE_URL: string
  BACKEND_URL: string
}

// The request-logging middleware below runs ahead of auth.middleware(), so
// bezzie's `user` may or may not be populated by the time it logs -- bezzie's
// own OptionalVariables is the type for exactly that.
type Variables = OptionalVariables & {
  requestId: string
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const auth = createBezzie({
      ...providers.auth0(new URL(env.APP_BASE_URL).hostname),
      clientId: env.AUTH0_CLIENT_ID,
      clientSecret: env.AUTH0_CLIENT_SECRET,
      audience: env.AUTH0_AUDIENCE,
      adapter: cloudflareKVAdapter(env.SESSION_KV),
      baseUrl: env.APP_BASE_URL,
    })

    const app = new Hono<{ Bindings: Env; Variables: Variables }>()

    // Runs before auth, so every request gets one log line -- including auth
    // failures and 404s, which otherwise log nothing at all. The request id is
    // threaded onto outgoing backend calls (x-request-id) so a single id greps
    // across both services' logs for the same request.
    app.use('*', async (c, next) => {
      const requestId = crypto.randomUUID()
      c.set('requestId', requestId)
      c.header('X-Request-Id', requestId)
      const startedAt = Date.now()
      await next()
      log.info('request completed', {
        requestId,
        method: c.req.method,
        path: new URL(c.req.url).pathname,
        status: c.res.status,
        durationMs: Date.now() - startedAt,
        userSub: c.var.user?.sub,
      })
    })

    app.route('/auth', auth.routes())
    app.get('/api/me', auth.middleware(), (c) => c.json(c.var.user))

    app.get('/api/info', auth.middleware(), async (c) => {
      const transport = createConnectTransport({
        baseUrl: `${c.env.BACKEND_URL}/connect`,
        useBinaryFormat: true,
        fetch: workersFetch,
      })
      const client = createClient(TemplateService, transport)
      const info = await client.getServerInfo({}, { headers: { 'x-request-id': c.var.requestId } })
      return c.json(info)
    })

    return app.fetch(request, env, ctx)
  }
}
