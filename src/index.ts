import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';

const app = new Elysia()
  // 1. Redirect Root ke Swagger (PAKAI ALAMAT LENGKAP HTTPS!)
  // Ini memaksa browser loncat ke alamat aman, gak peduli server aslinya HTTP.
  .get('/', ({ set }) => {
    set.status = 301;
    set.redirect = 'https://dev-apps.utycreative.cloud/api/swagger/';
  })

  // 2. Group API (SISANYA SAMA SEPERTI TADI, JANGAN DIUBAH)
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
            servers: [
              {
                url: 'https://dev-apps.utycreative.cloud',
                description: 'Production Server'
              }
            ],
            tags: [
              { name: 'general', description: 'General endpoints' },
              { name: 'health', description: 'Health check endpoints' },
            ],
          },
          scalarConfig: {
            spec: {
              url: '/api/swagger/json'
            }
          }
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
      .post('/echo', ({ body }) => ({
        received: body,
        timestamp: new Date().toISOString(),
      }), {
        detail: {
          tags: ['echo'],
          summary: 'Echo request body',
        },
      })
  )
  .listen(2201);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);