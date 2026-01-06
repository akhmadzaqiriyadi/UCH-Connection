import { Elysia, t } from 'elysia';
import { dosenService } from './dosen.service';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware';

export const dosenController = new Elysia({ prefix: '/dosen' })
  .use(authMiddleware)
  .use(requireRole('admin')) // Protected for Admin only

  // List Dosen
  .get('/', async ({ query }) => {
    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 10;
    
    return await dosenService.findAll({
      page,
      limit,
      search: query.search,
      fakultasId: query.fakultasId,
    });
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      search: t.Optional(t.String()),
      fakultasId: t.Optional(t.String()),
    }),
    detail: {
      tags: ['Dosen'],
      summary: 'List Dosen',
      description: 'Get paginated list of Dosen (joined with User & Fakultas data).',
      responses: {
        200: {
          description: 'Successful retrieval of dosen',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success response',
                  value: {
                    data: [
                      {
                        id: 'dosen-123',
                        userId: 'user-123',
                        nip: '198001012005011001',
                        fullName: 'Dr. Budi Santoso, M.Kom.',
                        email: 'budi@uty.ac.id',
                        fakultasId: 'fakultas-123',
                        fakultasName: 'Fakultas Sains & Teknologi',
                        jabatan: 'Lektor Kepala',
                        noHp: '08123456789',
                        createdAt: '2024-01-01T00:00:00.000Z'
                      }
                    ],
                    meta: {
                      total: 10,
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
    const dosenData = await dosenService.findById(params.id);
    if (!dosenData) {
      set.status = 404;
      return { success: false, message: 'Dosen not found' };
    }
    return { success: true, data: dosenData };
  }, {
    detail: {
      tags: ['Dosen'],
      summary: 'Get Dosen Detail',
      responses: {
        200: {
          description: 'Dosen found',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success response',
                  value: {
                    success: true,
                    data: {
                      id: 'dosen-123',
                      userId: 'user-123',
                      nip: '198001012005011001',
                      fullName: 'Dr. Budi Santoso, M.Kom.',
                      email: 'budi@uty.ac.id',
                      fakultasId: 'fakultas-123',
                      fakultasName: 'Fakultas Sains & Teknologi',
                      jabatan: 'Lektor Kepala',
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
          description: 'Dosen not found'
        }
      }
    }
  })

  // Create Dosen (Transaction)
  .post('/', async ({ body, set }) => {
    try {
      const newDosen = await dosenService.create(body);
      set.status = 201;
      return { success: true, data: newDosen };
    } catch (error: any) {
      console.error('Create Dosen Error:', error);
      set.status = 400;
      return { success: false, message: error.message || 'Failed to create dosen' };
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      fullName: t.String(),
      password: t.Optional(t.String({ minLength: 6 })),
      nip: t.String(),
      fakultasId: t.String(),
      jabatan: t.Optional(t.String()),
      noHp: t.Optional(t.String()),
      existingUserId: t.Optional(t.String()),
    }),
    detail: {
      tags: ['Dosen'],
      summary: 'Create Dosen',
      description: 'Creates both User account and Dosen profile in a single transaction.',
      responses: {
        201: {
          description: 'Dosen created successfully',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success response',
                  value: {
                    success: true,
                    data: {
                      id: 'dosen-new',
                      userId: 'user-new',
                      nip: '198001012005011001',
                      fullName: 'Dr. Budi Santoso, M.Kom.',
                      email: 'budi@uty.ac.id',
                      fakultasId: 'fakultas-123',
                      fakultasName: 'Fakultas Sains & Teknologi',
                      jabatan: 'Lektor Kepala',
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

  // Update Dosen
  .patch('/:id', async ({ params, body, set }) => {
    try {
        const updated = await dosenService.update(params.id, body);
        if (!updated) {
        set.status = 404;
        return { success: false, message: 'Dosen not found' };
        }
        return { success: true, data: updated };
    } catch (error: any) {
        set.status = 400;
        return { success: false, message: error.message || 'Failed to update dosen' };
    }
  }, {
    body: t.Object({
      email: t.Optional(t.String({ format: 'email' })),
      fullName: t.Optional(t.String()),
      password: t.Optional(t.String({ minLength: 6 })),
      nip: t.Optional(t.String()),
      fakultasId: t.Optional(t.String()),
      jabatan: t.Optional(t.String()),
      noHp: t.Optional(t.String()),
    }),
    detail: {
      tags: ['Dosen'],
      summary: 'Update Dosen',
      description: 'Update User info and/or Dosen academic info.',
      responses: {
        200: {
          description: 'Dosen updated successfully',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success response',
                  value: {
                    success: true,
                    data: {
                      id: 'dosen-123',
                      userId: 'user-123',
                      nip: '198001012005011001',
                      fullName: 'Updated Name',
                      email: 'budi@uty.ac.id',
                      fakultasId: 'fakultas-123',
                      fakultasName: 'Fakultas Sains & Teknologi',
                      jabatan: 'Lektor Kepala',
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
          description: 'Dosen not found'
        }
      }
    }
  })

  // Soft Delete
  .delete('/:id', async ({ params, set }) => {
    const deleted = await dosenService.delete(params.id);
    if (!deleted) {
      set.status = 404;
      return { success: false, message: 'Dosen not found' };
    }
    return { success: true, message: 'Dosen and User account deleted successfully' };
  }, {
    detail: {
      tags: ['Dosen'],
      summary: 'Delete Dosen (Soft Delete)',
      description: 'Soft deletes both Dosen profile and linked User account.',
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
                    message: 'Dosen and User account deleted successfully'
                  }
                }
              }
            }
          }
        },
        404: {
          description: 'Dosen not found'
        }
      }
    }
  });
