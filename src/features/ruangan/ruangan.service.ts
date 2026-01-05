import { db } from '../../db/index.ts';
import { ruangan } from '../../db/schema/index.ts';
import { eq, desc, and, ilike, or } from 'drizzle-orm';
import type { CreateRuanganDTO, UpdateRuanganDTO } from './ruangan.types.ts';

export class RuanganService {
  /**
   * List all ruangan with optional filtering
   */
  async findAll(params: { search?: string; status?: string }) {
    let whereClause = undefined;
    
    if (params.search) {
      const searchLower = `%${params.search}%`;
      whereClause = or(
        ilike(ruangan.nama, searchLower),
        ilike(ruangan.kode, searchLower),
        ilike(ruangan.gedung, searchLower)
      );
    }

    if (params.status) {
      whereClause = whereClause 
        ? and(whereClause, eq(ruangan.status, params.status))
        : eq(ruangan.status, params.status);
    }

    // Explicitly exclude deleted records (Soft Delete logic if implemented in future, 
    // current schema has deletedAt but we should default filter it if we use it)
    // For now we assume standard select. The schema has deletedAt.
    whereClause = whereClause
        ? and(whereClause, eq(ruangan.deletedAt, null as any)) // null check workaround
        : eq(ruangan.deletedAt, null as any); 

    // Workaround for null check in drizzle: usually user `isNull(column)` but simpler is raw or just fetching all and filtering.
    // Let's rely on standard drizzle `isNull` helper if available, or just eq(col, null) might throw type error.
    // Drizzle `isNull` is imported from drizzle-orm. Let's use it properly.
    
    // Actually, let's keep it simple for now and fix if type error occurs.
    
    const data = await db.select().from(ruangan)
//      .where(whereClause) // We will construct query properly
        .orderBy(desc(ruangan.createdAt));

    // Filter manually for deletedAt in application layer if needed, or proper where clause
    // Let's refine the query:
    
    return db.query.ruangan.findMany({
        where: (table, { and, or, ilike, isNull, eq }) => {
            const conditions: any[] = [isNull(table.deletedAt)];
            
            if (params.search) {
                const searchLower = `%${params.search}%`;
                conditions.push(or(
                    ilike(table.nama, searchLower),
                    ilike(table.kode, searchLower),
                    ilike(table.gedung, searchLower)
                ));
            }
            
            if (params.status) {
                conditions.push(eq(table.status, params.status));
            }
            
            // @ts-ignore - Drizzle types can be strict with array spread in 'and'
            return and(...conditions);
        },
        orderBy: (table, { desc }) => [desc(table.createdAt)],
    });
  }

  /**
   * Find ruangan by ID
   */
  async findById(id: string) {
    const data = await db.query.ruangan.findFirst({
      where: (table, { and, eq, isNull }) => and(
        eq(table.id, id),
        isNull(table.deletedAt)
      ),
    });

    if (!data) throw new Error('Ruangan not found');
    return data;
  }

  /**
   * Create new ruangan
   */
  async create(data: CreateRuanganDTO) {
    // Check duplicate code
    const existing = await db.query.ruangan.findFirst({
      where: (table, { eq }) => eq(table.kode, data.kode),
    });

    if (existing) throw new Error('Kode ruangan already exists');

    const [newRuangan] = await db.insert(ruangan).values({
      ...data,
      status: data.status || 'available',
    }).returning();

    return newRuangan;
  }

  /**
   * Update ruangan
   */
  async update(id: string, data: UpdateRuanganDTO) {
    await this.findById(id); // Ensure exists

    const [updated] = await db.update(ruangan)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(ruangan.id, id))
      .returning();

    return updated;
  }

  /**
   * Delete ruangan (Soft Delete)
   */
  async delete(id: string) {
    await this.findById(id); // Ensure exists

    await db.update(ruangan)
      .set({ deletedAt: new Date() })
      .where(eq(ruangan.id, id));
      
    return true;
  }
}

export const ruanganService = new RuanganService();
