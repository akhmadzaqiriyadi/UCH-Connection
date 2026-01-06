import { Elysia } from 'elysia';

export const healthController = new Elysia({ prefix: '/health' })
  .get('/', () => ({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }), {
    detail: {
      tags: ['health'],
      summary: 'Health check endpoint',
      description: 'Returns server health status and uptime',
    },
  });
