
export interface MahasiswaDTO {
  id: string; // ID from mahasiswa table
  userId: string;
  nim: string;
  fullName: string; // from users
  email: string; // from users
  prodiId: string;
  prodiName: string; // from prodi join
  angkatan: number;
  noHp: string | null;
  createdAt: Date;
}

export interface CreateMahasiswaDTO {
  // User Data
  email: string;
  password?: string; // Optional, default generated if empty
  fullName: string;
  
  // Mahasiswa Data
  nim: string;
  prodiId: string;
  angkatan: number;
  noHp?: string;
}

export interface UpdateMahasiswaDTO {
  // User Data
  email?: string;
  fullName?: string;
  password?: string;
  
  // Mahasiswa Data
  nim?: string;
  prodiId?: string;
  angkatan?: number;
  noHp?: string;
}

export interface MahasiswaFilters {
  search?: string; // Search by name or nim
  prodiId?: string;
  angkatan?: number;
  page: number;
  limit: number;
}
