import { Elysia, t } from 'elysia';
import { mahasiswaService } from './mahasiswa.service';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware';

export const mahasiswaController = new Elysia({ prefix: '/mahasiswa' })
  .use(authMiddleware)
  .use(requireRole('admin')) // Protected for Admin only

  // List Mahasiswa
  .get('/', async ({ query }) => {
    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 10;
    
    return await mahasiswaService.findAll({
      page,
      limit,
      search: query.search,
      prodiId: query.prodiId,
      angkatan: query.angkatan ? parseInt(query.angkatan) : undefined,
    });
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      search: t.Optional(t.String()),
      prodiId: t.Optional(t.String()),
      angkatan: t.Optional(t.String()),
    }),
    detail: {
      tags: ['Mahasiswa'],
      summary: 'List Mahasiswa',
      description: 'Get paginated list of Mahasiswa (joined with User & Prodi data).',
      responses: {
        200: {
          description: 'Successful retrieval of mahasiswa',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success response',
                  value: {
                    data: [
                      {
                        id: 'mhs-123',
                        userId: 'user-123',
                        nim: '1234567890',
                        fullName: 'Budi Santoso',
                        email: 'budi@uty.ac.id',
                        prodiId: 'prodi-123',
                        prodiName: 'Informatika',
                        angkatan: 2024,
                        noHp: '08123456789',
                        createdAt: '2024-01-01T00:00:00.000Z'
                      }
                    ],
                    meta: {
                      total: 1,
                      page: 1,
                      limit: 10,
                      totalPages: 1
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  // Get Detail
  .get('/:id', async ({ params, set }) => {
    const mhs = await mahasiswaService.findById(params.id);
    if (!mhs) {
      set.status = 404;
      return { success: false, message: 'Mahasiswa not found' };
    }
    return { success: true, data: mhs };
  }, {
    detail: {
      tags: ['Mahasiswa'],
      summary: 'Get Mahasiswa Detail',
      responses: {
        200: {
          description: 'Mahasiswa found',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success response',
                  value: {
                    success: true,
                    data: {
                      id: 'mhs-123',
                      userId: 'user-123',
                      nim: '1234567890',
                      fullName: 'Budi Santoso',
                      email: 'budi@uty.ac.id',
                      prodiId: 'prodi-123',
                      prodiName: 'Informatika',
                      angkatan: 2024,
                      noHp: '08123456789',
                      createdAt: '2024-01-01T00:00:00.000Z'
                    }
                  }
                }
              }
            }
          }
        },
        404: {
          description: 'Mahasiswa not found'
        }
      }
    }
  })

  // Create Mahasiswa (Transaction)
  .post('/', async ({ body, set }) => {
    try {
      const newMhs = await mahasiswaService.create(body);
      set.status = 201;
      return { success: true, data: newMhs };
    } catch (error: any) {
      console.error('Create Mahasiswa Error:', error);
      set.status = 400;
      return { success: false, message: error.message || 'Failed to create mahasiswa' };
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      fullName: t.String(),
      password: t.Optional(t.String({ minLength: 6 })),
      nim: t.String(),
      prodiId: t.String(),
      angkatan: t.Number(),
      noHp: t.Optional(t.String()),
      existingUserId: t.Optional(t.String()),
    }),
    detail: {
      tags: ['Mahasiswa'],
      summary: 'Create Mahasiswa',
      description: 'Creates both User account and Mahasiswa profile in a single transaction.',
      responses: {
        201: {
          description: 'Mahasiswa created successfully',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success response',
                  value: {
                    success: true,
                    data: {
                      id: 'mhs-new',
                      userId: 'user-new',
                      nim: '1234567890',
                      fullName: 'Mahasiswa Baru',
                      email: 'mhs.baru@uty.ac.id',
                      prodiId: 'prodi-123',
                      prodiName: 'Informatika',
                      angkatan: 2024,
                      noHp: '08123456789',
                      createdAt: '2024-01-01T00:00:00.000Z'
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad Request'
        }
      }
    }
  })

  // Update Mahasiswa
  .patch('/:id', async ({ params, body, set }) => {
    try {
        const updated = await mahasiswaService.update(params.id, body);
        if (!updated) {
        set.status = 404;
        return { success: false, message: 'Mahasiswa not found' };
        }
        return { success: true, data: updated };
    } catch (error: any) {
        set.status = 400;
        return { success: false, message: error.message || 'Failed to update mahasiswa' };
    }
  }, {
    body: t.Object({
      email: t.Optional(t.String({ format: 'email' })),
      fullName: t.Optional(t.String()),
      password: t.Optional(t.String({ minLength: 6 })),
      nim: t.Optional(t.String()),
      prodiId: t.Optional(t.String()),
      angkatan: t.Optional(t.Number()),
      noHp: t.Optional(t.String()),
    }),
    detail: {
      tags: ['Mahasiswa'],
      summary: 'Update Mahasiswa',
      description: 'Update User info and/or Mahasiswa academic info.',
      responses: {
        200: {
          description: 'Mahasiswa updated successfully',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success response',
                  value: {
                    success: true,
                    data: {
                      id: 'mhs-123',
                      userId: 'user-123',
                      nim: '1234567890',
                      fullName: 'Updated Name',
                      email: 'budi@uty.ac.id',
                      prodiId: 'prodi-123',
                      prodiName: 'Informatika',
                      angkatan: 2024,
                      noHp: '08123456789',
                      createdAt: '2024-01-01T00:00:00.000Z'
                    }
                  }
                }
              }
            }
          }
        },
        404: {
          description: 'Mahasiswa not found'
        }
      }
    }
  })

  // Soft Delete
  .delete('/:id', async ({ params, set }) => {
    const deleted = await mahasiswaService.delete(params.id);
    if (!deleted) {
      set.status = 404;
      return { success: false, message: 'Mahasiswa not found' };
    }
    return { success: true, message: 'Mahasiswa and User account deleted successfully' };
  }, {
    detail: {
      tags: ['Mahasiswa'],
      summary: 'Delete Mahasiswa (Soft Delete)',
      description: 'Soft deletes both Mahasiswa profile and linked User account.',
      responses: {
        200: {
          description: 'Deleted successfully',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success response',
                  value: {
                    success: true,
                    message: 'Mahasiswa and User account deleted successfully'
                  }
                }
              }
            }
          }
        },
        404: {
          description: 'Mahasiswa not found'
        }
      }
    }
  });
