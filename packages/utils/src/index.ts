export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function createTraceId(prefix = "trace"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function ensureArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function createLogger(namespace: string) {
  return {
    info: (message: string, meta?: unknown) => console.log(`[${namespace}]`, message, meta ?? ""),
    error: (message: string, meta?: unknown) => console.error(`[${namespace}]`, message, meta ?? ""),
    warn: (message: string, meta?: unknown) => console.warn(`[${namespace}]`, message, meta ?? ""),
  };
}
