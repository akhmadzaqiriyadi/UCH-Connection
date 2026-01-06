import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { authService } from './auth.service.ts';
import { config } from '../../config/index.ts';
import type { TokenPayload } from './auth.types.ts';

export const authController = new Elysia({ prefix: '/auth' })
  .use(
    jwt({
      name: 'jwt',
      secret: config.jwt.secret,
      exp: config.jwt.expiresIn,
    })
  )
  
  /**
   * POST /auth/register
   */
  .post('/register', async ({ body, jwt }) => {
    try {
      const result = await authService.register(body as any);
      
      // Sign access token with JWT
      const accessToken = await jwt.sign({
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role,
      } as TokenPayload);

      return {
        success: true,
        data: {
          user: result.user,
          accessToken,
          refreshToken: result.refreshToken,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      password: t.String({ minLength: 6 }),
      fullName: t.String({ minLength: 3 }),
      role: t.String(),
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Object({
          user: t.Object({
            id: t.String(),
            email: t.String(),
            fullName: t.String(),
            role: t.String(),
            mahasiswa: t.Optional(t.Any()),
            dosen: t.Optional(t.Any()),
          }),
          accessToken: t.String(),
          refreshToken: t.String(),
        })),
        error: t.Optional(t.String()),
      }),
    },
    detail: {
      tags: ['auth'],
      summary: 'Register new user',
      description: 'Create a new user account. Password must be at least 6 characters.',
      responses: {
        200: {
          description: 'Successful registration',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Successful registration',
                  value: {
                    success: true,
                    data: {
                      user: {
                        id: '550e8400-e29b-41d4-a716-446655440000',
                        email: 'john.doe@uch.ac.id',
                        fullName: 'John Doe',
                        role: 'mahasiswa',
                      },
                      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                      refreshToken: '7c6f1c2445c2683463be14a63e0175bc...',
                    },
                  },
                },
                error: {
                  summary: 'Registration failed',
                  value: {
                    success: false,
                    error: 'Email already registered',
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  /**
   * POST /auth/login
   */
  .post('/login', async ({ body, jwt }) => {
    try {
      const result = await authService.login(body);
      
      // Sign access token with JWT
      const accessToken = await jwt.sign({
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role,
      } as TokenPayload);

      return {
        success: true,
        data: {
          user: result.user,
          accessToken,
          refreshToken: result.refreshToken,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      password: t.String(),
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Object({
          user: t.Object({
            id: t.String(),
            email: t.String(),
            fullName: t.String(),
            role: t.String(),
            mahasiswa: t.Optional(t.Any()),
            dosen: t.Optional(t.Any()),
          }),
          accessToken: t.String(),
          refreshToken: t.String(),
        })),
        error: t.Optional(t.String()),
      }),
    },
    detail: {
      tags: ['auth'],
      summary: 'Login user',
      description: 'Authenticate user with email and password',
      responses: {
        200: {
          description: 'Login response',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Successful login',
                  value: {
                    success: true,
                    data: {
                      user: {
                        id: '52b2b22d-1110-4555-b271-cb1f2d9391a9',
                        email: 'admin@uch.ac.id',
                        fullName: 'Administrator',
                        role: 'admin',
                      },
                      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                      refreshToken: '7c6f1c2445c2683463be14a63e0175bc...',
                    },
                  },
                },
                error: {
                  summary: 'Invalid credentials',
                  value: {
                    success: false,
                    error: 'Invalid email or password',
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  /**
   * POST /auth/refresh
   */
  .post('/refresh', async ({ body, jwt }) => {
    try {
      const result = await authService.refreshAccessToken(body.refreshToken, jwt);
      
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }, {
    body: t.Object({
      refreshToken: t.String(),
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Object({
          accessToken: t.String(),
        })),
        error: t.Optional(t.String()),
      }),
    },
    detail: {
      tags: ['auth'],
      summary: 'Refresh access token',
      description: 'Get new access token using refresh token',
      responses: {
        200: {
          description: 'Refresh token response',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Token refreshed',
                  value: {
                    success: true,
                    data: {
                      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    },
                  },
                },
                error: {
                  summary: 'Invalid refresh token',
                  value: {
                    success: false,
                    error: 'Invalid refresh token',
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  /**
   * POST /auth/logout
   */
  .post('/logout', async ({ body, headers, jwt }) => {
    try {
      const authHeader = headers.authorization;
      if (!authHeader) {
        throw new Error('No authorization header');
      }

      const token = authHeader.replace('Bearer ', '');
      const payload = await jwt.verify(token) as TokenPayload;
      
      await authService.logout(payload.userId, body.refreshToken);

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }, {
    body: t.Object({
      refreshToken: t.String(),
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        message: t.Optional(t.String()),
        error: t.Optional(t.String()),
      }),
    },
    detail: {
      tags: ['auth'],
      summary: 'Logout user',
      description: 'Invalidate refresh token (requires Authorization header)',
      responses: {
        200: {
          description: 'Logout response',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Logged out successfully',
                  value: {
                    success: true,
                    message: 'Logged out successfully',
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  /**
   * POST /auth/forgot-password
   */
  .post('/forgot-password', async ({ body }) => {
    try {
      await authService.forgotPassword(body);
      
      return {
        success: true,
        message: 'If email exists, reset instructions have been sent.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        message: t.Optional(t.String()),
        error: t.Optional(t.String()),
      }),
    },
    detail: {
      tags: ['auth'],
      summary: 'Request password reset',
      description: 'Send reset password link to email',
      responses: {
        200: {
          description: 'Request accepted',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success',
                  value: {
                    success: true,
                    message: 'If email exists, reset instructions have been sent.',
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  /**
   * POST /auth/reset-password
   */
  .post('/reset-password', async ({ body }) => {
    try {
      await authService.resetPassword(body);
      
      return {
        success: true,
        message: 'Password has been reset successfully.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }, {
    body: t.Object({
      token: t.String(),
      newPassword: t.String({ minLength: 6 }),
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        message: t.Optional(t.String()),
        error: t.Optional(t.String()),
      }),
    },
    detail: {
      tags: ['auth'],
      summary: 'Reset password',
      description: 'Reset password using valid token',
      responses: {
        200: {
          description: 'Password reset result',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success',
                  value: {
                    success: true,
                    message: 'Password has been reset successfully.',
                  },
                },
                error: {
                  summary: 'Invalid token',
                  value: {
                    success: false,
                    error: 'Invalid or expired token',
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  /**
   * GET /auth/me
   */
  .get('/me', async ({ headers, jwt }) => {
    try {
      const authHeader = headers.authorization;
      if (!authHeader) {
        throw new Error('No authorization header');
      }

      const token = authHeader.replace('Bearer ', '');
      const payload = await jwt.verify(token) as TokenPayload;
      
      const user = await authService.getCurrentUser(payload.userId);

      return {
        success: true,
        data: user,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }, {
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Object({
          id: t.String(),
          email: t.String(),
          fullName: t.String(),
          role: t.String(),
          createdAt: t.String(),
          mahasiswa: t.Optional(t.Any()),
          dosen: t.Optional(t.Any()),
        })),
        error: t.Optional(t.String()),
      }),
    },
    detail: {
      tags: ['auth'],
      summary: 'Get current user',
      description: 'Get authenticated user profile (requires Authorization header with Bearer token)',
      responses: {
        200: {
          description: 'Current user data',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'User profile',
                  value: {
                    success: true,
                    data: {
                      id: '52b2b22d-1110-4555-b271-cb1f2d9391a9',
                      email: 'admin@uch.ac.id',
                      fullName: 'Administrator',
                      role: 'admin',
                      createdAt: '2026-01-04T01:46:12.731Z',
                    },
                  },
                },
                error: {
                  summary: 'Unauthorized',
                  value: {
                    success: false,
                    error: 'No authorization header',
                  },
                },
              },
            },
          },
        },
      },
    },
  });
