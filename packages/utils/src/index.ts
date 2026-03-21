export function createLogger(scope: string) {
  return {
    info(message: string, meta?: unknown) {
      console.log(`[${scope}] ${message}`, meta ?? "");
    },
    error(message: string, meta?: unknown) {
      console.error(`[${scope}] ${message}`, meta ?? "");
    }
  };
}

export function invariant<T>(value: T | null | undefined, message: string): T {
  if (value == null) throw new Error(message);
  return value;
}
