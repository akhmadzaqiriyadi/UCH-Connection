import { db } from '../../db';
import { users } from '../../db/schema';
import { eq, and, like, or, desc, sql, inArray, isNull } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import type { CreateUserDTO, UpdateUserDTO, UserFilters, UserDTO, PaginatedResponse } from './users.types';

export const usersService = {
  // Get all users with pagination and filtering
  async findAll(filters: UserFilters): Promise<PaginatedResponse<UserDTO>> {
    const { page, limit, search, role } = filters;
    const offset = (page - 1) * limit;

    const conditions = [isNull(users.deletedAt)]; // Only active users

    if (role) {
      conditions.push(eq(users.role, role));
    }

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      conditions.push(
        or(
          like(sql`lower(${users.email})`, searchLower),
          like(sql`lower(${users.fullName})`, searchLower)
        )!
      );
    }

    const whereClause = and(...conditions);

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause);
    
    const total = Number(countResult.count);
    const totalPages = Math.ceil(total / limit);

    // Get data
    const data = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(users.createdAt));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  },

  // Get single user by ID
  async findById(id: string): Promise<UserDTO | null> {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);

    return user || null;
  },

  // Create new user
  async create(data: CreateUserDTO): Promise<UserDTO> {
    const hashedPassword = await hash(data.password, 10);
    
    const [newUser] = await db
      .insert(users)
      .values({
        email: data.email,
        password: hashedPassword,
        fullName: data.fullName,
        role: data.role,
      })
      .returning({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return newUser;
  },

  // Update user
  async update(id: string, data: UpdateUserDTO): Promise<UserDTO | null> {
    const updateData: any = { ...data, updatedAt: new Date() };
    
    if (data.password) {
      updateData.password = await hash(data.password, 10);
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .returning({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return updatedUser || null;
  },

  // Soft delete user
  async delete(id: string): Promise<boolean> {
    const [deletedUser] = await db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .returning({ id: users.id });

    return !!deletedUser;
  },

  // Bulk soft delete users
  async bulkDelete(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;

    const result = await db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(and(inArray(users.id, ids), isNull(users.deletedAt)))
      .returning({ id: users.id });

    return result.length;
  }
};
