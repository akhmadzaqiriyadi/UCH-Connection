import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';

const app = new Elysia()
  // 1. Redirect Halaman Depan (/) ke Swagger
  // Karena Nginx dilewati, App harus redirect sendiri.
  .get('/', ({ set }) => {
    set.redirect = '/api/swagger';
  })

  // 2. Masukkan semua endpoint ke dalam Group "/api"
  // Supaya rapi dan sesuai format yang kamu mau: domain.com/api/...
  .group('/api', (app) =>
    app
      .use(
        swagger({
          path: '/swagger', // Akses Swagger di: /api/swagger
          documentation: {
            info: {
              title: 'UCH Connection API',
              version: '1.0.0',
              description: 'API documentation for UCH Connection Elysia.js server',
            },
            tags: [
              { name: 'general', description: 'General endpoints' },
              { name: 'health', description: 'Health check endpoints' },
              { name: 'greetings', description: 'Greeting endpoints' },
              { name: 'echo', description: 'Echo endpoints' },
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
  // 3. LISTEN DI PORT 2201 (WAJIB SESUAI ADMIN)
  .listen(2201);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);