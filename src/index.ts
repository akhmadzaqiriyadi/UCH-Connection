import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';

const app = new Elysia()
  // 1. Redirect Root ke Swagger (Explicit status code)
  .get('/', ({ set }) => {
    set.status = 301;
    set.redirect = '/api/swagger';
  })

  // 2. Group API
  .group('/api', (app) =>
    app
      .use(
        swagger({
          path: '/swagger',
          documentation: {
            info: {
              title: 'UCH Connection API',
              version: '1.0.0',
              description: 'API documentation for UCH Connection Elysia.js server',
            },
            // --- BAGIAN INI PENTING BIAR SWAGGER GAK BLANK ---
            servers: [
              {
                url: 'https://dev-apps.utycreative.cloud',
                description: 'Production Server'
              }
            ],
            // ------------------------------------------------
            tags: [
              { name: 'general', description: 'General endpoints' },
              { name: 'health', description: 'Health check endpoints' },
            ],
          },
        })
      )
      .get('/health', () => ({
        status: 'ok',
        uptime: process.uptime(),
      }), {
        detail: {
          tags: ['health'],
          summary: 'Health check',
        },
      })
      .get('/hello/:name', ({ params: { name } }) => ({
        message: `Hello, ${name}!`,
      }), {
        detail: {
          tags: ['greetings'],
          summary: 'Personalized greeting',
        },
      })
  )
  .listen(2201);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);