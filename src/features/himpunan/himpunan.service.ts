import { db } from '../../db';
import { himpunan, himpunanMembers, mahasiswa, users, prodi } from '../../db/schema';
import { eq, like, and, desc, sql, isNull } from 'drizzle-orm';
import type { CreateHimpunanDTO, UpdateHimpunanDTO, HimpunanDTO, AddHimpunanMemberDTO, HimpunanMemberDTO } from './himpunan.types';

export const himpunanService = {
  // --- CRUD Himpunan ---

  async findAll(search?: string): Promise<HimpunanDTO[]> {
    const conditions = [isNull(himpunan.deletedAt)];
    if (search) {
      conditions.push(like(sql`lower(${himpunan.nama})`, `%${search.toLowerCase()}%`));
    }

    const data = await db
      .select({
        id: himpunan.id,
        nama: himpunan.nama,
        prodiId: himpunan.prodiId,
        prodiName: prodi.nama,
        deskripsi: himpunan.deskripsi,
        createdAt: himpunan.createdAt,
      })
      .from(himpunan)
      .innerJoin(prodi, eq(himpunan.prodiId, prodi.id))
      .where(and(...conditions))
      .orderBy(desc(himpunan.createdAt));

    return data;
  },

  async findById(id: string): Promise<HimpunanDTO | null> {
    const [result] = await db
      .select({
        id: himpunan.id,
        nama: himpunan.nama,
        prodiId: himpunan.prodiId,
        prodiName: prodi.nama,
        deskripsi: himpunan.deskripsi,
        createdAt: himpunan.createdAt,
      })
      .from(himpunan)
      .innerJoin(prodi, eq(himpunan.prodiId, prodi.id))
      .where(and(eq(himpunan.id, id), isNull(himpunan.deletedAt)))
      .limit(1);
    
    return result || null;
  },

  async create(data: CreateHimpunanDTO): Promise<HimpunanDTO> {
    const [newHimpunan] = await db.insert(himpunan).values(data).returning();
    
    // Fetch with Join for return
    const [result] = await db
      .select({
        id: himpunan.id,
        nama: himpunan.nama,
        prodiId: himpunan.prodiId,
        prodiName: prodi.nama,
        deskripsi: himpunan.deskripsi,
        createdAt: himpunan.createdAt,
      })
      .from(himpunan)
      .innerJoin(prodi, eq(himpunan.prodiId, prodi.id))
      .where(eq(himpunan.id, newHimpunan.id));

    return result;
  },

  async update(id: string, data: UpdateHimpunanDTO): Promise<HimpunanDTO | null> {
     await db
      .update(himpunan)
      .set({ ...data })
      .where(eq(himpunan.id, id));
    
    // Return fresh data
    return this.findById(id);
  },

  async delete(id: string): Promise<boolean> {
    const [deleted] = await db
      .update(himpunan)
      .set({ deletedAt: new Date() })
      .where(eq(himpunan.id, id))
      .returning();
      
    return !!deleted;
  },

  // --- Membership ---

  async addMember(himpunanId: string, data: AddHimpunanMemberDTO) {
    // Check duplication
    const existing = await db
      .select()
      .from(himpunanMembers)
      .where(and(eq(himpunanMembers.himpunanId, himpunanId), eq(himpunanMembers.mahasiswaId, data.mahasiswaId)))
      .limit(1);
    
    if (existing.length) {
      throw new Error('Mahasiswa already a member of this Himpunan');
    }

    await db.insert(himpunanMembers).values({
      himpunanId,
      mahasiswaId: data.mahasiswaId,
      jabatan: data.jabatan || 'Anggota',
    });
    
    return true;
  },

  async removeMember(himpunanId: string, mahasiswaId: string) {
    await db
      .delete(himpunanMembers)
      .where(and(eq(himpunanMembers.himpunanId, himpunanId), eq(himpunanMembers.mahasiswaId, mahasiswaId)));
    return true;
  },

  async getMembers(himpunanId: string): Promise<HimpunanMemberDTO[]> {
    const members = await db
      .select({
        id: himpunanMembers.id,
        himpunanId: himpunanMembers.himpunanId,
        mahasiswaId: himpunanMembers.mahasiswaId,
        mahasiswaName: users.fullName,
        mahasiswaNIM: mahasiswa.nim,
        jabatan: himpunanMembers.jabatan,
        joinedAt: himpunanMembers.joinedAt,
      })
      .from(himpunanMembers)
      .innerJoin(mahasiswa, eq(himpunanMembers.mahasiswaId, mahasiswa.id))
      .innerJoin(users, eq(mahasiswa.userId, users.id))
      .where(eq(himpunanMembers.himpunanId, himpunanId));

    return members;
  }
};
