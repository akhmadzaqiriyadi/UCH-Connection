import { Elysia } from 'elysia';
import pino from 'pino';

// Create pino logger with pretty printing for development
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
  level: 'info',
});

/**
 * Request logging middleware using Pino
 */
export const loggingMiddleware = (app: Elysia) =>
  app
    .derive(({ request }) => {
      const method = request.method;
      const url = new URL(request.url);
      const path = url.pathname;
      
      logger.info({ method, path }, `📥 Incoming request`);
      
      return { startTime: Date.now() };
    })
    .onAfterHandle(({ request, response, startTime }) => {
      const method = request.method;
      const url = new URL(request.url);
      const path = url.pathname;
      const duration = Date.now() - (startTime || Date.now());
      
      // Get status code
      let status = 200;
      if (response instanceof Response) {
        status = response.status;
      }
      
      const emoji = status >= 200 && status < 300 ? '✅' : 
                    status >= 400 && status < 500 ? '⚠️' : '❌';
      
      logger.info(
        { method, path, status, duration: `${duration}ms` },
        `${emoji} Response sent`
      );
    })
    .onError(({ request, error, code }) => {
      const method = request.method;
      const url = new URL(request.url);
      const path = url.pathname;
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error(
        { method, path, code, error: errorMessage },
        `❌ Error occurred`
      );
      
      // Return error response
      return {
        success: false,
        error: errorMessage,
        code,
      };
    });
