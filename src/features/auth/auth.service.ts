import { db } from '../../db/index.ts';
import { users } from '../../db/schema/index.ts';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { refreshTokenService } from '../../lib/redis.ts';
import { config } from '../../config/index.ts';
import type { RegisterDTO, LoginDTO, AuthResponse, TokenPayload } from './auth.types.ts';

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterDTO): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const [newUser] = await db.insert(users).values({
      email: data.email,
      password: hashedPassword,
      fullName: data.fullName,
      role: data.role,
    }).returning();

    // Generate tokens
    const accessToken = await this.generateAccessToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    const refreshToken = await this.generateRefreshToken(newUser.id);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginDTO): Promise<AuthResponse> {
    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });

    if (!user || user.deletedAt) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const accessToken = await this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string, jwt: any): Promise<{ accessToken: string }> {
    try {
      // Get userId from Redis using the opaque refresh token
      const userId = await refreshTokenService.getUserId(refreshToken);
      
      if (!userId) {
        throw new Error('Invalid refresh token');
      }

      // Generate new access token
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user || user.deletedAt) {
        throw new Error('User not found');
      }

      const accessToken = await this.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return { accessToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string, refreshToken: string): Promise<void> {
    await refreshTokenService.delete(refreshToken);
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || user.deletedAt) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }

  /**
   * Generate access token (JWT)
   */
  private async generateAccessToken(payload: TokenPayload): Promise<string> {
    // Will be replaced with actual JWT signing in controller
    return JSON.stringify(payload);
  }

  /**
   * Generate refresh token
   */
  private async generateRefreshToken(userId: string): Promise<string> {
    const token = this.generateRandomToken();
    
    // Store in Redis with expiration
    await refreshTokenService.save(
      userId,
      token,
      config.jwt.refreshTokenExpiresIn
    );

    return token;
  }

  /**
   * Generate random token
   */
  private generateRandomToken(): string {
    return Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
}

export const authService = new AuthService();
