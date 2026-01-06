import { Elysia, t } from 'elysia';
import { ruanganService } from './ruangan.service.ts';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware.ts';
import { saveFile } from '../../lib/file_utils.ts';

export const ruanganController = new Elysia({ prefix: '/ruangan' })

  /**
   * GET /ruangan
   * List all ruangan (Public or Authenticated? For now let's make it public for viewing, but management is admin)
   * The user said "pengguna wajib login untuk booking". Viewing might be public? 
   * Let's make viewing public for convenience, but management strict.
   */
  .get('/', async ({ query }) => {
    try {
      const data = await ruanganService.findAll({
        search: query.search,
        status: query.status
      });
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, {
    query: t.Object({
      search: t.Optional(t.String()),
      status: t.Optional(t.String())
    }),
    detail: {
      tags: ['Ruangan'],
      summary: 'List All Ruangan',
      description: 'Get list of rooms with optional filtering',
      responses: {
        200: {
            description: 'List of Ruangan',
            content: {
                'application/json': {
                    examples: {
                        success: {
                            summary: 'Success',
                            value: {
                                success: true,
                                data: [
                                    {
                                        id: '123-abc',
                                        kode: 'A.2.1',
                                        nama: 'Lab Komputer',
                                        gedung: 'A',
                                        lantai: 2,
                                        kapasitas: 40,
                                        fasilitas: 'AC, PC',
                                        image: '/uploads/ruangan/abc.jpg',
                                        status: 'available'
                                    }
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

  // Protected Admin Routes for Management
  .group('/manage', app => app
    .use(requireRole('admin'))

    /**
     * POST /ruangan/manage/upload
     * Upload Room Image
     */
    .post('/upload', async ({ body, set }: any) => {
        try {
            if (!body.file) throw new Error('File is required');
            const path = await saveFile(body.file, 'ruangan');
            return { success: true, data: { path } };
        } catch (error: any) {
            set.status = 400;
            return { success: false, error: error.message };
        }
    }, {
        body: t.Object({
            file: t.File()
        }),
        detail: {
            tags: ['Ruangan'],
            summary: 'Upload Room Image (Admin)',
            description: 'Upload image file. Returns relative path to be stored in DB.',
            responses: {
                200: {
                    description: 'Image Uploaded',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                example: {
                                    success: true,
                                    data: { path: "/uploads/ruangan/room-a.jpg" }
                                }
                            }
                        }
                    }
                }
            }
        }
    })
    
    /**
     * POST /ruangan/manage
     * Create new room
     */
    .post('/', async ({ body }) => {
      try {
        const data = await ruanganService.create(body);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }, {
      body: t.Object({
        kode: t.String({ minLength: 3 }),
        nama: t.String({ minLength: 3 }),
        lantai: t.Number(),
        gedung: t.String(),
        kapasitas: t.Number(),
        fasilitas: t.Optional(t.String()),
        image: t.Optional(t.String()), // Image path from upload
        status: t.Optional(t.Union([t.Literal('available'), t.Literal('maintenance')]))
      }),
      detail: {
        tags: ['Ruangan'],
        summary: 'Create Ruangan (Admin)',
        responses: {
            201: {
                description: 'Created',
                content: {
                    'application/json': {
                        examples: {
                            success: {
                                summary: 'Success',
                                value: { 
                                    success: true, 
                                    data: { id: 'new-id', kode: 'A.3.1', nama: 'New Room' } 
                                }
                            }
                        }
                    }
                }
            }
        }
      }
    })

    /**
     * PATCH /ruangan/manage/:id
     * Update room
     */
    .patch('/:id', async ({ params, body }) => {
      try {
        const data = await ruanganService.update(params.id, body);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }, {
      body: t.Object({
        kode: t.Optional(t.String()),
        nama: t.Optional(t.String()),
        lantai: t.Optional(t.Number()),
        gedung: t.Optional(t.String()),
        kapasitas: t.Optional(t.Number()),
        fasilitas: t.Optional(t.String()),
        image: t.Optional(t.String()),
        status: t.Optional(t.Union([t.Literal('available'), t.Literal('maintenance')]))
      }),
      detail: {
        tags: ['Ruangan'],
        summary: 'Update Ruangan (Admin)',
        responses: {
            200: {
                description: 'Updated',
                content: {
                    'application/json': {
                        examples: {
                            success: {
                                summary: 'Success',
                                value: { 
                                    success: true, 
                                    data: { id: 'x', kode: 'A.3.1', nama: 'Updated Name', status: 'maintenance' } 
                                }
                            }
                        }
                    }
                }
            }
        }
      }
    })

    /**
     * DELETE /ruangan/manage/:id
     * Delete room
     */
    .delete('/:id', async ({ params }) => {
      try {
        await ruanganService.delete(params.id);
        return { success: true, message: 'Ruangan deleted successfully' };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }, {
      detail: {
        tags: ['Ruangan'],
        summary: 'Delete Ruangan (Admin)',
        responses: {
            200: {
                description: 'Deleted',
                content: {
                    'application/json': {
                        examples: {
                            success: {
                                summary: 'Success',
                                value: { success: true, message: 'Ruangan deleted successfully' } 
                            }
                        }
                    }
                }
            }
        }
      }
    })
  );
