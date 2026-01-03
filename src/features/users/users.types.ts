
export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'dosen' | 'mahasiswa' | 'staff';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'dosen' | 'mahasiswa' | 'staff';
}

export interface UpdateUserDTO {
  email?: string;
  password?: string;
  fullName?: string;
  role?: 'admin' | 'dosen' | 'mahasiswa' | 'staff';
}

export interface UserFilters {
  role?: 'admin' | 'dosen' | 'mahasiswa' | 'staff';
  search?: string;
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
