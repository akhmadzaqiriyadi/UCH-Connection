import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { config } from './config/index.ts';
import { logger } from './lib/utils.ts';
import { loggingMiddleware } from './middlewares/logging.middleware.ts';
import { homeController } from './features/home/home.controller.ts';
import { healthController } from './features/health/health.controller.ts';
import { authController } from './features/auth/auth.controller.ts';
import { usersController } from './features/users/users.controller.ts';

// Create app with logging
const app = loggingMiddleware(new Elysia())
  // Global plugins
  .use(cors())
  
  // Home page
  .use(homeController)
  
  // API routes group
  .group('/api', (app) =>
    app
      .use(
        swagger({
          path: '/swagger',
          documentation: {
            info: config.swagger.info,
            servers: config.swagger.servers,
            tags: [
              { name: 'auth', description: 'Authentication endpoints' },
              { name: 'health', description: 'Health check endpoints' },
              { name: 'Users', description: 'User management endpoints (Admin only)' },
            ],
          },
          scalarConfig: {
            spec: {
              url: '/api/swagger/json'
            }
          }
        })
      )
      // Feature controllers
      .use(healthController)
      .use(authController)
      .use(usersController)
  )
  
  .listen(config.port);

logger.info(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);