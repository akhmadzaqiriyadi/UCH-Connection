import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors'; // Opsional: Bagus buat jaga-jaga

const app = new Elysia()
  // Tambahkan CORS biar browser gak rewel soal security (Opsional tapi recommended)
  .use(cors())

  // 1. Redirect Root ke Swagger (DENGAN SLASH DI UJUNG!)
  .get('/', ({ set }) => {
    set.status = 301;
    // PERUBAHAN PENTING: Tambah '/' di akhir string
    set.redirect = '/api/swagger/'; 
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
            // Pastikan URL server ini benar
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