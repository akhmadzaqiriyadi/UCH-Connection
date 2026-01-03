import { Elysia, t } from 'elysia';
import { himpunanService } from './himpunan.service';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware';

export const himpunanController = new Elysia({ prefix: '/himpunan' })
  .use(authMiddleware)
  .use(requireRole('admin'))

  // List Himpunan
  .get('/', async ({ query }) => {
    const data = await himpunanService.findAll(query.search);
    return { success: true, data };
  }, {
    query: t.Object({
      search: t.Optional(t.String())
    }),
    detail: {
      tags: ['Himpunan'],
      summary: 'List All Himpunan',
      responses: {
        200: {
          description: 'List of Himpunan',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success response',
                  value: {
                    success: true,
                    data: [
                      {
                        id: 'himpunan-1',
                        nama: 'Himpunan Informatika',
                      prodiId: 'prodi-1',
                      prodiName: 'Informatika',
                      deskripsi: 'Wadah mahasiswa informatika',
                      createdAt: '2024-01-01T00:00:00Z'
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

  // Get Detail
  .get('/:id', async ({ params, set }) => {
    const data = await himpunanService.findById(params.id);
    if (!data) {
      set.status = 404;
      return { success: false, message: 'Himpunan not found' };
    }
    return { success: true, data };
  }, {
    detail: {
      tags: ['Himpunan'],
      summary: 'Get Himpunan Detail',
      responses: {
        200: {
          description: 'Himpunan Details',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success',
                  value: {
                    success: true,
                    data: {
                      id: 'himpunan-1',
                      nama: 'Himpunan Informatika',
                      prodiId: 'prodi-1',
                      prodiName: 'Informatika',
                      deskripsi: 'Wadah mahasiswa informatika',
                      createdAt: '2024-01-01T00:00:00Z'
                    }
                  }
                }
              }
            }
          }
        },
        404: {
          description: 'Himpunan not found'
        }
      }
    }
  })

  // Create
  .post('/', async ({ body, set }) => {
    try {
      const data = await himpunanService.create(body);
      set.status = 201;
      return { success: true, data };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }, {
    body: t.Object({
      nama: t.String(),
      prodiId: t.String(),
      deskripsi: t.Optional(t.String())
    }),
    detail: {
      tags: ['Himpunan'],
      summary: 'Create Himpunan',
      responses: {
        201: {
          description: 'Himpunan Created',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success',
                  value: {
                    success: true,
                    data: {
                      id: 'himpunan-new',
                      nama: 'Himpunan Baru',
                      prodiId: 'prodi-1',
                      prodiName: 'Informatika',
                      deskripsi: 'Deskripsi Himpunan Baru',
                      createdAt: '2024-01-01T00:00:00Z'
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

  // Update
  .patch('/:id', async ({ params, body, set }) => {
    const updated = await himpunanService.update(params.id, body);
    if (!updated) {
      set.status = 404;
      return { success: false, message: 'Himpunan not found' };
    }
    return { success: true, data: updated };
  }, {
    body: t.Object({
      nama: t.Optional(t.String()),
      prodiId: t.Optional(t.String()),
      deskripsi: t.Optional(t.String())
    }),
    detail: {
      tags: ['Himpunan'],
      summary: 'Update Himpunan',
      responses: {
        200: {
          description: 'Himpunan Updated',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success',
                  value: {
                    success: true,
                    data: {
                      id: 'himpunan-1',
                      nama: 'Himpunan Updated',
                      prodiId: 'prodi-1',
                      prodiName: 'Informatika',
                      deskripsi: 'Updated Desc',
                      createdAt: '2024-01-01T00:00:00Z'
                    }
                  }
                }
              }
            }
          }
        },
        404: {
          description: 'Himpunan not found'
        }
      }
    }
  })

  // Delete
  .delete('/:id', async ({ params, set }) => {
    const deleted = await himpunanService.delete(params.id);
    if (!deleted) {
      set.status = 404;
      return { success: false, message: 'Himpunan not found' };
    }
    return { success: true, message: 'Himpunan deleted successfully' };
  }, {
    detail: {
      tags: ['Himpunan'],
      summary: 'Delete Himpunan',
      responses: {
        200: {
          description: 'Himpunan Deleted',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success',
                  value: {
                    success: true,
                    message: 'Himpunan deleted successfully'
                  }
                }
              }
            }
          }
        },
        404: {
          description: 'Himpunan not found'
        }
      }
    }
  })

  // --- Membership ---

  // Get Members
  .get('/:id/members', async ({ params }) => {
    const members = await himpunanService.getMembers(params.id);
    return { success: true, data: members };
  }, {
    detail: {
      tags: ['Himpunan'],
      summary: 'List Himpunan Members',
      responses: {
        200: {
          description: 'List Members',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success',
                  value: {
                    success: true,
                    data: [
                      {
                        id: 'mem-1',
                        himpunanId: 'himpunan-1',
                        mahasiswaId: 'mhs-1',
                        mahasiswaName: 'Budi',
                        mahasiswaNIM: '12345',
                        jabatan: 'Ketua',
                        joinedAt: '2024-01-01T00:00:00Z'
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

  // Add Member
  .post('/:id/members', async ({ params, body, set }) => {
    try {
      await himpunanService.addMember(params.id, body);
      set.status = 201;
      return { success: true, message: 'Member added successfully' };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  }, {
    body: t.Object({
      mahasiswaId: t.String(),
      jabatan: t.Optional(t.String())
    }),
    detail: {
      tags: ['Himpunan'],
      summary: 'Add Member to Himpunan',
      responses: {
        201: {
          description: 'Member Added',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success',
                  value: {
                    success: true,
                    message: 'Member added successfully'
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

  // Remove Member
  .delete('/:id/members/:mahasiswaId', async ({ params, set }) => {
    try {
      await himpunanService.removeMember(params.id, params.mahasiswaId);
      return { success: true, message: 'Member removed successfully' };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  }, {
    detail: {
      tags: ['Himpunan'],
      summary: 'Kick Member from Himpunan',
      responses: {
        200: {
          description: 'Member Removed',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success',
                  value: {
                    success: true,
                    message: 'Member removed successfully'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Failed to Remove'
        }
      }
    }
  });
