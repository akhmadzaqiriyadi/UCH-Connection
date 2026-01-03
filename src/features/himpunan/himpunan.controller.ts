import { Elysia, t } from 'elysia';
import { himpunanService } from './himpunan.service';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware';

export const himpunanController = new Elysia({ prefix: '/himpunan' })
  .use(authMiddleware)
  .use(requireRole('admin'))

  // List Himpunan
  .get('/', async ({ query }) => {
    return await himpunanService.findAll(query.search);
  }, {
    query: t.Object({
      search: t.Optional(t.String())
    }),
    detail: {
      tags: ['Himpunan (Himpunan Mahasiswa)'],
      summary: 'List All Himpunan',
      responses: {
        200: {
          description: 'List of Himpunan',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success response',
                  value: [
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
      tags: ['Himpunan (Himpunan Mahasiswa)'],
      summary: 'Get Himpunan Detail'
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
      tags: ['Himpunan (Himpunan Mahasiswa)'],
      summary: 'Create Himpunan'
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
      tags: ['Himpunan (Himpunan Mahasiswa)'],
      summary: 'Update Himpunan'
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
      tags: ['Himpunan (Himpunan Mahasiswa)'],
      summary: 'Delete Himpunan'
    }
  })

  // --- Membership ---

  // Get Members
  .get('/:id/members', async ({ params }) => {
    const members = await himpunanService.getMembers(params.id);
    return { success: true, data: members };
  }, {
    detail: {
      tags: ['Himpunan (Himpunan Mahasiswa)'],
      summary: 'List Himpunan Members'
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
      tags: ['Himpunan (Himpunan Mahasiswa)'],
      summary: 'Add Member to Himpunan'
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
      tags: ['Himpunan (Himpunan Mahasiswa)'],
      summary: 'Kick Member from Himpunan'
    }
  });
