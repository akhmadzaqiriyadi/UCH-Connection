/**
 * Standard API Response
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Health Check Response
 */
export interface HealthResponse {
  status: 'ok' | 'error';
  uptime: number;
  timestamp: string;
}
