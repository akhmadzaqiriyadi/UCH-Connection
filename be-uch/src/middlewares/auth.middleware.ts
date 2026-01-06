import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { config } from '../config/index.ts';
import type { TokenPayload } from '../features/auth/auth.types.ts';

/**
 * JWT Authentication Middleware
 */
export const authMiddleware = new Elysia({ name: 'auth' })
  .use(
    jwt({
      name: 'jwt',
      secret: config.jwt.secret,
    })
  )
  .derive(async ({ headers, jwt, set }) => {
    const authHeader = headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      set.status = 401;
      throw new Error('Unauthorized: No token provided');
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      const payload = await jwt.verify(token);
      
      if (!payload) {
        set.status = 401;
        throw new Error('Unauthorized: Invalid token');
      }

      return {
        user: payload as TokenPayload,
      };
    } catch (error) {
      set.status = 401;
      throw new Error('Unauthorized: Invalid token');
    }
  });

/**
 * Role-based access control middleware
 * MUST be used AFTER authMiddleware
 */
export const requireRole = (...allowedRoles: string[]) => {
  return new Elysia()
    .derive(({ user, set }: any) => {
      if (!user || !allowedRoles.includes(user.role)) {
        set.status = 403;
        throw new Error('Forbidden: Insufficient permissions');
      }
      
      return { user };
    });
};
