type Bucket = { times: number[] };

const g = globalThis as unknown as { __ntLimit?: Map<string, Bucket> };

function store() {
  if (!g.__ntLimit) g.__ntLimit = new Map();
  return g.__ntLimit;
}

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const buckets = store();
  const b = buckets.get(key) ?? { times: [] };
  b.times = b.times.filter((t) => now - t < windowMs);
  if (b.times.length >= max) {
    buckets.set(key, b);
    return false;
  }
  b.times.push(now);
  buckets.set(key, b);
  return true;
}

export function clientKey(request: Request, extra: string) {
  const fwd = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = fwd || request.headers.get("x-real-ip") || "local";
  return `${ip}:${extra}`;
}
