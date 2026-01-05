import { t } from 'elysia';

export interface RuanganDTO {
  id: string;
  kode: string;
  nama: string;
  lantai: number;
  gedung: string;
  kapasitas: number;
  fasilitas?: string | null;
  status: string;
  createdAt: string;
}

export type CreateRuanganDTO = {
  kode: string;
  nama: string;
  lantai: number;
  gedung: string;
  kapasitas: number;
  fasilitas?: string;
  status?: 'available' | 'maintenance';
};

export type UpdateRuanganDTO = Partial<CreateRuanganDTO>;
