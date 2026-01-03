export const config = {
  port: parseInt(process.env.PORT || '2201'),
  env: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/uch_connection_db',
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshTokenExpiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN || String(7 * 24 * 60 * 60)), // 7 days in seconds
  },
  
  swagger: {
    servers: [
      {
        url: 'http://localhost:2201/api',
        description: 'Development Server (Local)'
      },
      {
        url: 'https://dev-apps.utycreative.cloud/api',
        description: 'Production Server'
      }
    ],
    info: {
      title: 'UCH Connection API',
      version: '1.0.0',
      description: 'API documentation for UCH Connection Elysia.js server',
    }
  }
};
