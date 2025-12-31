import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';

const app = new Elysia()
  .use(
    swagger({
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
  .get('/', () => ({
    message: 'Welcome to Elysia.js!',
    timestamp: new Date().toISOString(),
  }), {
    detail: {
      tags: ['general'],
      summary: 'Welcome endpoint',
      description: 'Returns a welcome message with the current timestamp',
    },
  })
  .get('/health', () => ({
    status: 'ok',
    uptime: process.uptime(),
  }), {
    detail: {
      tags: ['health'],
      summary: 'Health check',
      description: 'Returns the server status and uptime information',
    },
  })
  .get('/hello/:name', ({ params: { name } }) => ({
    message: `Hello, ${name}!`,
  }), {
    detail: {
      tags: ['greetings'],
      summary: 'Personalized greeting',
      description: 'Returns a personalized greeting message',
    },
  })
  .post('/echo', ({ body }) => ({
    received: body,
    timestamp: new Date().toISOString(),
  }), {
    detail: {
      tags: ['echo'],
      summary: 'Echo request body',
      description: 'Echoes back the request body with a timestamp',
    },
  })
  .listen(2201);


console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);
