import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { fakultas, prodi } from '../../db/schema';
import { desc, isNull } from 'drizzle-orm';

export const masterController = new Elysia({ prefix: '/master' })
  // No auth required for dropdowns (usually safe, or add auth if prefer strict)
  // For now, let's keep it public or basic auth. User suggested for 'create', so likely authenticated user uses it.
  // But let's allow it generally for easier FE integration.

  // Get All Fakultas
  .get('/fakultas', async () => {
    const data = await db
      .select({
        id: fakultas.id,
        nama: fakultas.nama,
        kode: fakultas.kode
      })
      .from(fakultas)
      .where(isNull(fakultas.deletedAt))
      .orderBy(desc(fakultas.nama));
      
    return { success: true, data };
  }, {
    detail: {
      tags: ['Master Data'],
      summary: 'List Fakultas (For Dropdowns)',
      responses: {
        200: {
          description: 'List of Fakultas',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success',
                  value: {
                    success: true,
                    data: [
                      { id: 'uuid', nama: 'Fakultas Sains & Teknologi', kode: 'FST' }
                    ]
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  // Get All Prodi
  .get('/prodi', async () => {
    const data = await db
      .select({
        id: prodi.id,
        nama: prodi.nama,
        kode: prodi.kode,
        fakultasId: prodi.fakultasId
      })
      .from(prodi)
      .where(isNull(prodi.deletedAt))
      .orderBy(desc(prodi.nama));
      
    return { success: true, data };
  }, {
    detail: {
      tags: ['Master Data'],
      summary: 'List Prodi (For Dropdowns)',
      responses: {
        200: {
          description: 'List of Prodi',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success',
                  value: {
                    success: true,
                    data: [
                      { id: 'uuid', nama: 'Informatika', kode: 'IF', fakultasId: 'uuid' }
                    ]
                  }
                }
              }
            }
          }
        }
      }
    }
  });
