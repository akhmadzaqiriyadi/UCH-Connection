/**
 * Logger utility
 */
export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
};

/**
 * Format date to ISO string
 */
export function formatDate(date: Date = new Date()): string {
  return date.toISOString();
}
