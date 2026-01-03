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
      description: 'Get paginated list of Mahasiswa (joined with User & Prodi data).'
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
      summary: 'Get Mahasiswa Detail'
    }
  })

  // Create Mahasiswa (Transaction)
  .post('/', async ({ body, set }) => {
    try {
      const newMhs = await mahasiswaService.create(body);
      set.status = 201;
      return { success: true, data: newMhs };
    } catch (error: any) {
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
    }),
    detail: {
      tags: ['Mahasiswa'],
      summary: 'Create Mahasiswa',
      description: 'Creates both User account and Mahasiswa profile in a single transaction.'
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
      description: 'Update User info and/or Mahasiswa academic info.'
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
      description: 'Soft deletes both Mahasiswa profile and linked User account.'
    }
  });
