import { db } from '../../db';
import { users, mahasiswa, prodi } from '../../db/schema';
import { eq, and, like, or, desc, sql, isNull } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import type { CreateMahasiswaDTO, UpdateMahasiswaDTO, MahasiswaFilters, MahasiswaDTO } from './mahasiswa.types';
import type { PaginatedResponse } from '../users/users.types'; // Reuse paginated response type

export const mahasiswaService = {
  // Get all mahasiswa with user and prodi info
  async findAll(filters: MahasiswaFilters): Promise<PaginatedResponse<MahasiswaDTO>> {
    const { page, limit, search, prodiId, angkatan } = filters;
    const offset = (page - 1) * limit;

    const conditions = [isNull(users.deletedAt)]; // Active users only (User deletion cascades logically)

    if (prodiId) {
      conditions.push(eq(mahasiswa.prodiId, prodiId));
    }

    if (angkatan) {
      conditions.push(eq(mahasiswa.angkatan, angkatan));
    }

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      conditions.push(
        or(
          like(sql`lower(${users.fullName})`, searchLower),
          like(sql`lower(${mahasiswa.nim})`, searchLower),
          like(sql`lower(${users.email})`, searchLower)
        )!
      );
    }

    const whereClause = and(...conditions);

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(mahasiswa)
      .innerJoin(users, eq(mahasiswa.userId, users.id))
      .where(whereClause);
    
    const total = Number(countResult.count);
    const totalPages = Math.ceil(total / limit);

    // Get data with joins
    const data = await db
      .select({
        id: mahasiswa.id,
        userId: users.id,
        nim: mahasiswa.nim,
        fullName: users.fullName,
        email: users.email,
        prodiId: mahasiswa.prodiId,
        prodiName: prodi.nama,
        angkatan: mahasiswa.angkatan,
        noHp: mahasiswa.noHp,
        createdAt: mahasiswa.createdAt,
      })
      .from(mahasiswa)
      .innerJoin(users, eq(mahasiswa.userId, users.id))
      .innerJoin(prodi, eq(mahasiswa.prodiId, prodi.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(mahasiswa.createdAt));

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

  // Get single mahasiswa by ID
  async findById(id: string): Promise<MahasiswaDTO | null> {
    const [result] = await db
      .select({
        id: mahasiswa.id,
        userId: users.id,
        nim: mahasiswa.nim,
        fullName: users.fullName,
        email: users.email,
        prodiId: mahasiswa.prodiId,
        prodiName: prodi.nama,
        angkatan: mahasiswa.angkatan,
        noHp: mahasiswa.noHp,
        createdAt: mahasiswa.createdAt,
      })
      .from(mahasiswa)
      .innerJoin(users, eq(mahasiswa.userId, users.id))
      .innerJoin(prodi, eq(mahasiswa.prodiId, prodi.id))
      .where(and(eq(mahasiswa.id, id), isNull(users.deletedAt)))
      .limit(1);

    return result || null;
  },

  // Create Mahasiswa (Transaction: User + Mahasiswa)
  async create(data: CreateMahasiswaDTO): Promise<MahasiswaDTO> {
    return await db.transaction(async (tx) => {
      // 1. Create User
      const hashedPassword = await hash(data.password || 'password123', 10); // Default password if not provided
      
      const [newUser] = await tx
        .insert(users)
        .values({
          email: data.email,
          password: hashedPassword,
          fullName: data.fullName,
          role: 'mahasiswa', // Force role
        })
        .returning();

      // 2. Create Mahasiswa Profile
      const [newMahasiswa] = await tx
        .insert(mahasiswa)
        .values({
          userId: newUser.id,
          nim: data.nim,
          prodiId: data.prodiId,
          angkatan: data.angkatan,
          noHp: data.noHp,
        })
        .returning();

      // 3. Fetch Prodi Name for return
      const [prodiData] = await tx
        .select({ nama: prodi.nama })
        .from(prodi)
        .where(eq(prodi.id, data.prodiId));

      return {
        id: newMahasiswa.id,
        userId: newUser.id,
        nim: newMahasiswa.nim,
        fullName: newUser.fullName,
        email: newUser.email,
        prodiId: newMahasiswa.prodiId,
        prodiName: prodiData?.nama || 'Unknown',
        angkatan: newMahasiswa.angkatan,
        noHp: newMahasiswa.noHp,
        createdAt: newMahasiswa.createdAt,
      };
    });
  },

  // Update Mahasiswa
  async update(id: string, data: UpdateMahasiswaDTO): Promise<MahasiswaDTO | null> {
    return await db.transaction(async (tx) => {
      // Get existing to find userId
      const current = await tx
         .select({ userId: mahasiswa.userId })
         .from(mahasiswa)
         .where(eq(mahasiswa.id, id))
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

      // Update Mahasiswa info if provided
      if (data.nim || data.prodiId || data.angkatan || data.noHp) {
        const mhsUpdate: any = {};
        if (data.nim) mhsUpdate.nim = data.nim;
        if (data.prodiId) mhsUpdate.prodiId = data.prodiId;
        if (data.angkatan) mhsUpdate.angkatan = data.angkatan;
        if (data.noHp) mhsUpdate.noHp = data.noHp;
        
        await tx.update(mahasiswa).set(mhsUpdate).where(eq(mahasiswa.id, id));
      }

      // Return updated DTO (reuse findById or reconstruct, here we reconstruct for safety within tx)
      // For simplicity/safety, let's just fetch full object after update
      // But since findById is outside tx scope (using 'db'), we might read stale data if isolation is low, 
      // but usually fine. To be strict, strict reuse 'tx'.
      // For now, let's call the find query logic again using 'tx'.
      
      const [result] = await tx
      .select({
        id: mahasiswa.id,
        userId: users.id,
        nim: mahasiswa.nim,
        fullName: users.fullName,
        email: users.email,
        prodiId: mahasiswa.prodiId,
        prodiName: prodi.nama,
        angkatan: mahasiswa.angkatan,
        noHp: mahasiswa.noHp,
        createdAt: mahasiswa.createdAt,
      })
      .from(mahasiswa)
      .innerJoin(users, eq(mahasiswa.userId, users.id))
      .innerJoin(prodi, eq(mahasiswa.prodiId, prodi.id))
      .where(eq(mahasiswa.id, id))
      .limit(1);
      
      return result || null;
    });
  },

  // Soft Delete (Delete User, which essentially hides Mahasiswa because of join)
  // Or explicitly soft delete both? 
  // Schema has deletedAt on Both.
  // Best practice: Delete 'User' is main. 
  async delete(id: string): Promise<boolean> {
     return await db.transaction(async (tx) => {
        const [mhs] = await tx.select({ userId: mahasiswa.userId }).from(mahasiswa).where(eq(mahasiswa.id, id));
        if (!mhs) return false;

        const now = new Date();
        
        // Soft delete Mahasiswa
        await tx.update(mahasiswa).set({ deletedAt: now }).where(eq(mahasiswa.id, id));
        
        // Soft delete User
        await tx.update(users).set({ deletedAt: now }).where(eq(users.id, mhs.userId));

        return true;
     });
  }
};
