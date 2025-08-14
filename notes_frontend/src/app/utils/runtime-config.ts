export function getRuntimeEnv(key: string, fallback = ''): string {
  /**
   * Reads runtime environment variables from a global window.__env object when running in the browser,
   * or from process.env when running in SSR. This avoids compile/lint issues by using globalThis.
   */
  try {
    const w = (globalThis as any)?.window as { __env?: Record<string, string | undefined> } | undefined;
    const val = w?.__env?.[key];
    if (val !== undefined) {
      return String(val);
    }
  } catch {
    // ignore
  }

  try {
    const env = (globalThis as any)?.process?.env as Record<string, string | undefined> | undefined;
    const val = env?.[key];
    if (val !== undefined) {
      return String(val);
    }
  } catch {
    // ignore
  }

  return fallback;
}
