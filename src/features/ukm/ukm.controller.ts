import { Elysia, t } from 'elysia';
import { ukmService } from './ukm.service';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware';

export const ukmController = new Elysia({ prefix: '/ukm' })
  .use(authMiddleware)
  .use(requireRole('admin')) // Admin access

  // List UKM
  .get('/', async ({ query }) => {
    return await ukmService.findAll(query.search);
  }, {
    query: t.Object({
      search: t.Optional(t.String())
    }),
    detail: {
      tags: ['UKM (Unit Kegiatan Mahasiswa)'],
      summary: 'List All UKM',
      responses: {
        200: {
          description: 'List of UKM',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success',
                  value: [
                    {
                      id: 'ukm-1',
                      nama: 'UKM Olahraga',
                      deskripsi: 'Unit kegiatan olahraga',
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
  })

  // Get Detail
  .get('/:id', async ({ params, set }) => {
    const data = await ukmService.findById(params.id);
    if (!data) {
      set.status = 404;
      return { success: false, message: 'UKM not found' };
    }
    return { success: true, data };
  }, {
    detail: {
      tags: ['UKM (Unit Kegiatan Mahasiswa)'],
      summary: 'Get UKM Detail',
      responses: {
        200: {
          description: 'UKM Details',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success',
                  value: {
                    success: true,
                    data: {
                      id: 'ukm-1',
                      nama: 'UKM Olahraga',
                      deskripsi: 'Unit kegiatan olahraga',
                      createdAt: '2024-01-01T00:00:00Z'
                    }
                  }
                }
              }
            }
          }
        },
        404: {
          description: 'UKM not found'
        }
      }
    }
  })

  // Create UKM
  .post('/', async ({ body, set }) => {
    try {
      const data = await ukmService.create(body);
      set.status = 201;
      return { success: true, data };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }, {
    body: t.Object({
      nama: t.String(),
      deskripsi: t.Optional(t.String())
    }),
    detail: {
      tags: ['UKM (Unit Kegiatan Mahasiswa)'],
      summary: 'Create UKM',
      responses: {
        201: {
          description: 'UKM Created',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success',
                  value: {
                    success: true,
                    data: {
                      id: 'ukm-new',
                      nama: 'UKM Baru',
                      deskripsi: 'Deskripsi UKM Baru',
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

  // Update UKM
  .patch('/:id', async ({ params, body, set }) => {
    const updated = await ukmService.update(params.id, body);
    if (!updated) {
      set.status = 404;
      return { success: false, message: 'UKM not found' };
    }
    return { success: true, data: updated };
  }, {
    body: t.Object({
      nama: t.Optional(t.String()),
      deskripsi: t.Optional(t.String())
    }),
    detail: {
      tags: ['UKM (Unit Kegiatan Mahasiswa)'],
      summary: 'Update UKM',
      responses: {
        200: {
          description: 'UKM Updated',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success',
                  value: {
                    success: true,
                    data: {
                      id: 'ukm-1',
                      nama: 'UKM Olahraga Updated',
                      deskripsi: 'Unit updated',
                      createdAt: '2024-01-01T00:00:00Z'
                    }
                  }
                }
              }
            }
          }
        },
        404: {
          description: 'UKM not found'
        }
      }
    }
  })

  // Delete UKM
  .delete('/:id', async ({ params, set }) => {
    const deleted = await ukmService.delete(params.id);
    if (!deleted) {
      set.status = 404;
      return { success: false, message: 'UKM not found' };
    }
    return { success: true, message: 'UKM deleted successfully' };
  }, {
    detail: {
      tags: ['UKM (Unit Kegiatan Mahasiswa)'],
      summary: 'Delete UKM',
      responses: {
        200: {
          description: 'UKM Deleted',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success',
                  value: {
                    success: true,
                    message: 'UKM deleted successfully'
                  }
                }
              }
            }
          }
        },
        404: {
          description: 'UKM not found'
        }
      }
    }
  })

  // --- Membership Endpoints ---

  // Get Members
  .get('/:id/members', async ({ params }) => {
    const members = await ukmService.getMembers(params.id);
    return { success: true, data: members };
  }, {
    detail: {
      tags: ['UKM (Unit Kegiatan Mahasiswa)'],
      summary: 'List UKM Members',
      responses: {
        200: {
          description: 'List of Members',
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
                        ukmId: 'ukm-1',
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
      await ukmService.addMember(params.id, body);
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
      tags: ['UKM (Unit Kegiatan Mahasiswa)'],
      summary: 'Add Member to UKM',
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
          description: 'Bad Request / Already Member'
        }
      }
    }
  })

  // Remove Member
  .delete('/:id/members/:mahasiswaId', async ({ params, set }) => {
    try {
      await ukmService.removeMember(params.id, params.mahasiswaId);
      return { success: true, message: 'Member removed successfully' };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  }, {
    detail: {
      tags: ['UKM (Unit Kegiatan Mahasiswa)'],
      summary: 'Kick Member from UKM',
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
          description: 'Failed to remove'
        }
      }
    }
  });
