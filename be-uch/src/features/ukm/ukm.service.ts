import { db } from '../../db';
import { ukm, ukmMembers, mahasiswa, users } from '../../db/schema';
import { eq, like, and, desc, sql, isNull } from 'drizzle-orm';
import type { CreateUKMDTO, UpdateUKMDTO, UKMDTO, AddUKMMemberDTO, UKMMemberDTO } from './ukm.types';

export const ukmService = {
  // --- CRUD UKM ---

  async findAll(search?: string): Promise<UKMDTO[]> {
    const conditions = [isNull(ukm.deletedAt)];
    if (search) {
      conditions.push(like(sql`lower(${ukm.nama})`, `%${search.toLowerCase()}%`));
    }

    const data = await db
      .select()
      .from(ukm)
      .where(and(...conditions))
      .orderBy(desc(ukm.createdAt));

    return data;
  },

  async findById(id: string): Promise<UKMDTO | null> {
    const [result] = await db
      .select()
      .from(ukm)
      .where(and(eq(ukm.id, id), isNull(ukm.deletedAt)))
      .limit(1);
    
    return result || null;
  },

  async create(data: CreateUKMDTO): Promise<UKMDTO> {
    const [newUKM] = await db.insert(ukm).values(data).returning();
    return newUKM;
  },

  async update(id: string, data: UpdateUKMDTO): Promise<UKMDTO | null> {
    const [updated] = await db
      .update(ukm)
      .set({ ...data }) // no updatedAt col in schema for UKM, just direct update
      .where(eq(ukm.id, id))
      .returning();
    
    return updated || null;
  },

  async delete(id: string): Promise<boolean> {
    const [deleted] = await db
      .update(ukm)
      .set({ deletedAt: new Date() })
      .where(eq(ukm.id, id))
      .returning();
      
    return !!deleted;
  },

  // --- Membership ---

  async addMember(ukmId: string, data: AddUKMMemberDTO) {
    // Check if already member
    const existing = await db
      .select()
      .from(ukmMembers)
      .where(and(eq(ukmMembers.ukmId, ukmId), eq(ukmMembers.mahasiswaId, data.mahasiswaId)))
      .limit(1);
    
    if (existing.length) {
      throw new Error('Mahasiswa already a member of this UKM');
    }

    await db.insert(ukmMembers).values({
      ukmId,
      mahasiswaId: data.mahasiswaId,
      jabatan: data.jabatan || 'Anggota',
    });
    
    return true;
  },

  async removeMember(ukmId: string, mahasiswaId: string) {
    await db
      .delete(ukmMembers)
      .where(and(eq(ukmMembers.ukmId, ukmId), eq(ukmMembers.mahasiswaId, mahasiswaId)));
    return true;
  },

  async getMembers(ukmId: string): Promise<UKMMemberDTO[]> {
    const members = await db
      .select({
        id: ukmMembers.id,
        ukmId: ukmMembers.ukmId,
        mahasiswaId: ukmMembers.mahasiswaId,
        mahasiswaName: users.fullName,
        mahasiswaNIM: mahasiswa.nim,
        jabatan: ukmMembers.jabatan,
        joinedAt: ukmMembers.joinedAt,
      })
      .from(ukmMembers)
      .innerJoin(mahasiswa, eq(ukmMembers.mahasiswaId, mahasiswa.id))
      .innerJoin(users, eq(mahasiswa.userId, users.id)) // Join to User for Name
      .where(eq(ukmMembers.ukmId, ukmId));

    return members;
  }
};
