import { isIP } from 'node:net';

type RequestAddress = { ip?: string; headers: Record<string, string | string[] | undefined> };

// Only Vercel's ingress may supply this header. Local/Functions callers cannot
// bypass their socket address by providing arbitrary forwarded headers.
export function clientIp(request: RequestAddress, vercel = process.env.VERCEL === '1') {
  const value = vercel ? request.headers['x-vercel-forwarded-for'] : request.ip;
  if (typeof value !== 'string' || !isIP(value.trim())) return undefined;
  const address = value.trim();
  return address.startsWith('::ffff:') && isIP(address.slice(7)) === 4 ? address.slice(7) : address;
}
