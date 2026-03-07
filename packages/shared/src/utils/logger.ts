/**
 * Simple logger utility
 * Wraps console methods for future extensibility (e.g., Winston, Pino)
 */
function sanitizeLogArg(val: unknown): string {
  let str: string;

  if (typeof val === 'string') {
    str = val;
  } else {
    try {
      str = JSON.stringify(val);
    } catch {
      str = String(val);
    }
  }

  return str
    .replace(/[\r\n]/g, ' ')
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
}

export const logger = {
  info: (...args: any[]) => console.log(...args.map(sanitizeLogArg)), // lgtm[js/log-injection]
  warn: (...args: any[]) => console.warn(...args.map(sanitizeLogArg)), // lgtm[js/log-injection]
  error: (...args: any[]) => console.error(...args.map(sanitizeLogArg)), // lgtm[js/log-injection]
  debug: (...args: any[]) => console.debug(...args.map(sanitizeLogArg)),
};
