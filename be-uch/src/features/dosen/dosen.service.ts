import { db } from '../../db';
import { users, dosen, fakultas } from '../../db/schema';
import { eq, and, like, or, desc, sql, isNull } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import type { CreateDosenDTO, UpdateDosenDTO, DosenFilters, DosenDTO } from './dosen.types';
import type { PaginatedResponse } from '../users/users.types';

export const dosenService = {
  // Get all dosen with user and fakultas info
  async findAll(filters: DosenFilters): Promise<PaginatedResponse<DosenDTO>> {
    const { page, limit, search, fakultasId } = filters;
    const offset = (page - 1) * limit;

    const conditions = [isNull(users.deletedAt)];

    if (fakultasId) {
      conditions.push(eq(dosen.fakultasId, fakultasId));
    }

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      conditions.push(
        or(
          like(sql`lower(${users.fullName})`, searchLower),
          like(sql`lower(${dosen.nip})`, searchLower),
          like(sql`lower(${users.email})`, searchLower)
        )!
      );
    }

    const whereClause = and(...conditions);

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(dosen)
      .innerJoin(users, eq(dosen.userId, users.id))
      .where(whereClause);
    
    const total = Number(countResult.count);
    const totalPages = Math.ceil(total / limit);

    // Get data with joins
    const data = await db
      .select({
        id: dosen.id,
        userId: users.id,
        nip: dosen.nip,
        fullName: users.fullName,
        email: users.email,
        fakultasId: dosen.fakultasId,
        fakultasName: fakultas.nama,
        jabatan: dosen.jabatan,
        noHp: dosen.noHp,
        createdAt: dosen.createdAt,
      })
      .from(dosen)
      .innerJoin(users, eq(dosen.userId, users.id))
      .innerJoin(fakultas, eq(dosen.fakultasId, fakultas.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(dosen.createdAt));

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

  // Get single dosen by ID
  async findById(id: string): Promise<DosenDTO | null> {
    const [result] = await db
      .select({
        id: dosen.id,
        userId: users.id,
        nip: dosen.nip,
        fullName: users.fullName,
        email: users.email,
        fakultasId: dosen.fakultasId,
        fakultasName: fakultas.nama,
        jabatan: dosen.jabatan,
        noHp: dosen.noHp,
        createdAt: dosen.createdAt,
      })
      .from(dosen)
      .innerJoin(users, eq(dosen.userId, users.id))
      .innerJoin(fakultas, eq(dosen.fakultasId, fakultas.id))
      .where(and(eq(dosen.id, id), isNull(users.deletedAt)))
      .limit(1);

    return result || null;
  },

  // Create Dosen (Transaction: User + Dosen)
  async create(data: CreateDosenDTO): Promise<DosenDTO> {
    return await db.transaction(async (tx) => {
      let userId = data.existingUserId;
      let userFullName = data.fullName;
      let userEmail = data.email;

      // 1. Handle User Creation or Linking
      if (userId) {
        // Verify user exists
        const user = await tx.query.users.findFirst({
          where: eq(users.id, userId),
        });

        if (!user || user.deletedAt) {
          throw new Error('User not found');
        }

        // Verify user doesn't already have dosen profile
        const existingProfile = await tx.query.dosen.findFirst({
          where: eq(dosen.userId, userId),
        });

        if (existingProfile) {
          throw new Error('User already has a Dosen profile');
        }

        // Update role if needed
        if (user.role !== 'dosen') {
             await tx.update(users).set({ role: 'dosen' }).where(eq(users.id, userId));
        }

        userFullName = user.fullName;
        userEmail = user.email;

      } else {
        // Create New User
        if (!data.email || !data.fullName) {
             throw new Error('Email and Full Name are required for new user creation');
        }

        const hashedPassword = await hash(data.password || 'password123', 10);
        
        const [newUser] = await tx
          .insert(users)
          .values({
            email: data.email,
            password: hashedPassword,
            fullName: data.fullName,
            role: 'dosen', 
          })
          .returning();
          
        userId = newUser.id;
        userFullName = newUser.fullName;
        userEmail = newUser.email;
      }

      // 2. Create Dosen Profile
      const [newDosen] = await tx
        .insert(dosen)
        .values({
          userId: userId!,
          nip: data.nip,
          fakultasId: data.fakultasId,
          jabatan: data.jabatan,
          noHp: data.noHp,
        })
        .returning();

      // 3. Fetch Fakultas Name for return
      const [fakultasData] = await tx
        .select({ nama: fakultas.nama })
        .from(fakultas)
        .where(eq(fakultas.id, data.fakultasId));

      return {
        id: newDosen.id,
        userId: userId!,
        nip: newDosen.nip,
        fullName: userFullName || '',
        email: userEmail || '',
        fakultasId: newDosen.fakultasId,
        fakultasName: fakultasData?.nama || 'Unknown',
        jabatan: newDosen.jabatan,
        noHp: newDosen.noHp,
        createdAt: newDosen.createdAt,
      };
    });
  },

  // Update Dosen
  async update(id: string, data: UpdateDosenDTO): Promise<DosenDTO | null> {
    return await db.transaction(async (tx) => {
      // Get existing to find userId
      const current = await tx
         .select({ userId: dosen.userId })
         .from(dosen)
         .where(eq(dosen.id, id))
         .limit(1);
         
      if (!current.length) return null;
      const userId = current[0].userId;

      // Update User info if provided
      if (data.email || data.fullName || data.password) {
        const userUpdate: any = { updatedAt: new Date() };
        if (data.email) userUpdate.email = data.email;
        if (data.fullName) userUpdate.fullName = data.fullName;
        if (data.password) userUpdate.password = await hash(data.password, 10);
        
        await tx.update(users).set(userUpdate).where(eq(users.id, userId));
      }

      // Update Dosen info if provided
      if (data.nip || data.fakultasId || data.jabatan || data.noHp) {
        const dosenUpdate: any = {};
        if (data.nip) dosenUpdate.nip = data.nip;
        if (data.fakultasId) dosenUpdate.fakultasId = data.fakultasId;
        if (data.jabatan) dosenUpdate.jabatan = data.jabatan;
        if (data.noHp) dosenUpdate.noHp = data.noHp;
        
        await tx.update(dosen).set(dosenUpdate).where(eq(dosen.id, id));
      }

      // Return updated DTO
      const [result] = await tx
      .select({
        id: dosen.id,
        userId: users.id,
        nip: dosen.nip,
        fullName: users.fullName,
        email: users.email,
        fakultasId: dosen.fakultasId,
        fakultasName: fakultas.nama,
        jabatan: dosen.jabatan,
        noHp: dosen.noHp,
        createdAt: dosen.createdAt,
      })
      .from(dosen)
      .innerJoin(users, eq(dosen.userId, users.id))
      .innerJoin(fakultas, eq(dosen.fakultasId, fakultas.id))
      .where(eq(dosen.id, id))
      .limit(1);
      
      return result || null;
    });
  },

  // Soft Delete
  async delete(id: string): Promise<boolean> {
     return await db.transaction(async (tx) => {
        const [target] = await tx.select({ userId: dosen.userId }).from(dosen).where(eq(dosen.id, id));
        if (!target) return false;

        const now = new Date();
        
        // Soft delete Dosen
        await tx.update(dosen).set({ deletedAt: now }).where(eq(dosen.id, id));
        
        // Soft delete User
        await tx.update(users).set({ deletedAt: now }).where(eq(users.id, target.userId));

        return true;
     });
  }
};
