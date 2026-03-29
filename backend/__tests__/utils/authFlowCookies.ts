import type express from 'express';

export function getSetCookieHeader(headers: Record<string, unknown>): string[] | undefined {
  const raw = headers['set-cookie'];
  if (Array.isArray(raw)) {
    return raw.filter((value): value is string => typeof value === 'string');
  }
  if (typeof raw === 'string') {
    return [raw];
  }
  return undefined;
}

export function getCookieValue(setCookieHeader: string[] | undefined, cookieName: string): string | null {
  if (!setCookieHeader || setCookieHeader.length === 0) return null;

  for (const rawCookie of setCookieHeader) {
    const [pair] = rawCookie.split(';');
    const [name, value] = pair.split('=');
    if (name === cookieName) {
      if (!value) return null;
      return decodeURIComponent(value);
    }
  }

  return null;
}

export const testCookieParser: express.RequestHandler = (req, _res, next) => {
  const cookieHeader = req.headers.cookie;
  const cookies: Record<string, string> = Object.create(null);

  if (cookieHeader) {
    for (const part of cookieHeader.split(';')) {
      const [nameRaw, ...rest] = part.trim().split('=');
      if (!nameRaw || nameRaw === '__proto__' || nameRaw === 'constructor' || nameRaw === 'prototype') continue;
      cookies[nameRaw] = decodeURIComponent(rest.join('=') || '');
    }
  }

  (req as any).cookies = cookies;
  next();
};
