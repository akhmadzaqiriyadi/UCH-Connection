
export interface UKMDTO {
  id: string;
  nama: string;
  deskripsi: string | null;
  createdAt: Date;
}

export interface CreateUKMDTO {
  nama: string;
  deskripsi?: string;
}

export interface UpdateUKMDTO {
  nama?: string;
  deskripsi?: string;
}

export interface UKMMemberDTO {
  id: string;
  ukmId: string;
  mahasiswaId: string;
  mahasiswaName: string; // Joined from Mahasiswa -> User
  mahasiswaNIM: string;
  jabatan: string | null;
  joinedAt: Date;
}

export interface AddUKMMemberDTO {
  mahasiswaId: string;
  jabatan?: string;
}
