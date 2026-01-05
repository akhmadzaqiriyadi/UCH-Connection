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
import { mahasiswaController } from './features/mahasiswa/mahasiswa.controller.ts';
import { dosenController } from './features/dosen/dosen.controller.ts';
import { ukmController } from './features/ukm/ukm.controller.ts';
import { himpunanController } from './features/himpunan/himpunan.controller.ts';
import { masterController } from './features/master/master.controller.ts';
import { dashboardController } from './features/dashboard/dashboard.controller.ts';
import { ruanganController } from './features/ruangan/ruangan.controller.ts';
import { bookingsController } from './features/bookings/bookings.controller.ts';

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
              { name: 'Mahasiswa', description: 'Mahasiswa Academic Data Management (Admin only)' },
              { name: 'Dosen', description: 'Dosen Data Management (Admin only)' },
              { name: 'UKM', description: 'Unit Kegiatan Mahasiswa Management (Admin only)' },
              { name: 'Himpunan', description: 'Himpunan Mahasiswa Management (Admin only)' },
              { name: 'Master Data', description: 'Public Master Data (Fakultas, Prodi) for Dropdowns' },
              { name: 'Dashboard', description: 'Admin Statistics (Admin only)' },
              { name: 'Ruangan', description: 'Room Master Data Management' },
              { name: 'Bookings', description: 'Room Booking System' },
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
      .use(mahasiswaController)
      .use(dosenController)
      .use(ukmController)
      .use(himpunanController)
      .use(masterController)
      .use(dashboardController)
      .use(ruanganController)
      .use(bookingsController)
  )
  
  .listen(config.port);

logger.info(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);