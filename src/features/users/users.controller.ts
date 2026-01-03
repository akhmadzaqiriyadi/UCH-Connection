import { Elysia, t } from 'elysia';
import { usersService } from './users.service';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware';

export const usersController = new Elysia({ prefix: '/users' })
  .use(authMiddleware)
  .use(requireRole('admin')) // Protect all user management routes for admin only
  
  // Get all users
  .get('/', async ({ query }) => {
    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 10;
    
    return await usersService.findAll({
      page,
      limit,
      search: query.search,
      role: query.role as any,
    });
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      search: t.Optional(t.String()),
      role: t.Optional(t.Union([
        t.Literal('admin'),
        t.Literal('dosen'),
        t.Literal('mahasiswa'),
        t.Literal('staff')
      ]))
    }),
    detail: {
      tags: ['Users'],
      summary: 'Get all users with pagination',
      description: 'Retrieve a paginated list of users with optional filtering by search term and role.'
    }
  })

  // Get user by ID
  .get('/:id', async ({ params, set }) => {
    const user = await usersService.findById(params.id);
    if (!user) {
      set.status = 404;
      return { success: false, message: 'User not found' };
    }
    return { success: true, data: user };
  }, {
    detail: {
      tags: ['Users'],
      summary: 'Get user details'
    }
  })

  // Create user
  .post('/', async ({ body, set }) => {
    try {
      const newUser = await usersService.create(body);
      set.status = 201;
      return { success: true, data: newUser };
    } catch (error) {
      set.status = 400;
      return { success: false, message: 'Failed to create user', error: String(error) };
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      password: t.String({ minLength: 6 }),
      fullName: t.String(),
      role: t.Union([
        t.Literal('admin'),
        t.Literal('dosen'),
        t.Literal('mahasiswa'),
        t.Literal('staff')
      ])
    }),
    detail: {
      tags: ['Users'],
      summary: 'Create new user'
    }
  })

  // Update user
  .patch('/:id', async ({ params, body, set }) => {
    const updatedUser = await usersService.update(params.id, body);
    if (!updatedUser) {
      set.status = 404;
      return { success: false, message: 'User not found' };
    }
    return { success: true, data: updatedUser };
  }, {
    body: t.Object({
      email: t.Optional(t.String({ format: 'email' })),
      password: t.Optional(t.String({ minLength: 6 })),
      fullName: t.Optional(t.String()),
      role: t.Optional(t.Union([
        t.Literal('admin'),
        t.Literal('dosen'),
        t.Literal('mahasiswa'),
        t.Literal('staff')
      ]))
    }),
    detail: {
      tags: ['Users'],
      summary: 'Update user'
    }
  })

  // Delete user
  .delete('/:id', async ({ params, set }) => {
    const deleted = await usersService.delete(params.id);
    if (!deleted) {
      set.status = 404;
      return { success: false, message: 'User not found' };
    }
    return { success: true, message: 'User deleted successfully' };
  }, {
    detail: {
      tags: ['Users'],
      summary: 'Delete user (Soft delete)'
    }
  })

  // Bulk delete users
  .delete('/bulk', async ({ body }) => {
    const deletedCount = await usersService.bulkDelete(body.ids);
    return { success: true, message: `${deletedCount} users deleted successfully` };
  }, {
    body: t.Object({
      ids: t.Array(t.String())
    }),
    detail: {
      tags: ['Users'],
      summary: 'Bulk delete users',
      description: 'Soft delete multiple users by their IDs.'
    }
  });
