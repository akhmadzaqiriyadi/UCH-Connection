export interface RegisterDTO {
  email: string;
  password: string;
  fullName: string;
  role: 'mahasiswa' | 'dosen' | 'staff' | 'user';
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  token: string;
  newPassword: string;
}

export interface TokenPayload extends Record<string, any> {
  userId: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    mahasiswa?: any;
    dosen?: any;
  };
  accessToken: string;
  refreshToken: string;
}
