import type { Request, Response, NextFunction } from 'express';

const requests = new Map<string, { count: number; expires: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 100;

export const rateLimit = (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip ?? 'unknown';
  const now = Date.now();
  const bucket = requests.get(key) ?? { count: 0, expires: now + WINDOW_MS };

  if (now > bucket.expires) {
    bucket.count = 0;
    bucket.expires = now + WINDOW_MS;
  }

  bucket.count += 1;
  requests.set(key, bucket);

  if (bucket.count > MAX_REQUESTS) {
    res.status(429).send('Rate limit exceeded.');
    return;
  }

  next();
};
