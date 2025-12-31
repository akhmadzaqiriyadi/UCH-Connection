import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';

const app = new Elysia()
  // --- JURUS PAMUNGKAS: HTML REDIRECT ---
  // Kita kirim HTML beneran biar browser dipaksa pindah dari sisi client.
  .get('/', ({ set }) => {
    set.headers['Content-Type'] = 'text/html';
    return `<!DOCTYPE html>
    <html>
      <head>
        <title>Redirecting...</title>
        <meta http-equiv="refresh" content="0; url=https://dev-apps.utycreative.cloud/api/swagger/" />
      </head>
      <body style="background: #111; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh;">
        <p>Mengalihkan ke Swagger UI... 🚀</p>
        <script>window.location.href = "https://dev-apps.utycreative.cloud/api/swagger/";</script>
      </body>
    </html>`;
  })
  // --------------------------------------

  // Group API (JANGAN DIUBAH, SUDAH BENAR)
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