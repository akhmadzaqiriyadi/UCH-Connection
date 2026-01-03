
export interface HimpunanDTO {
  id: string;
  nama: string;
  prodiId: string;
  prodiName: string; // Joined from Prodi
  deskripsi: string | null;
  createdAt: Date;
}

export interface CreateHimpunanDTO {
  nama: string;
  prodiId: string;
  deskripsi?: string;
}

export interface UpdateHimpunanDTO {
  nama?: string;
  prodiId?: string;
  deskripsi?: string;
}

export interface HimpunanMemberDTO {
  id: string;
  himpunanId: string;
  mahasiswaId: string;
  mahasiswaName: string;
  mahasiswaNIM: string;
  jabatan: string | null;
  joinedAt: Date;
}

export interface AddHimpunanMemberDTO {
  mahasiswaId: string;
  jabatan?: string;
}
