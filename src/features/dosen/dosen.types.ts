
export interface DosenDTO {
  id: string; // ID from dosen table
  userId: string;
  nip: string;
  fullName: string; // from users
  email: string; // from users
  fakultasId: string;
  fakultasName: string; // from fakultas join select
  jabatan: string | null;
  noHp: string | null;
  createdAt: Date;
}

export interface CreateDosenDTO {
  // User Data
  email: string;
  password?: string;
  fullName: string;
  
  // Dosen Data
  nip: string;
  fakultasId: string;
  jabatan?: string;
  noHp?: string;
}

export interface UpdateDosenDTO {
  // User Data
  email?: string;
  fullName?: string;
  password?: string;
  
  // Dosen Data
  nip?: string;
  fakultasId?: string;
  jabatan?: string;
  noHp?: string;
}

export interface DosenFilters {
  search?: string; // Search by name or NIP
  fakultasId?: string;
  page: number;
  limit: number;
}
