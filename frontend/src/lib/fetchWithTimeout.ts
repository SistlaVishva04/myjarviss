export class RequestTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs} ms`);
    this.name = "RequestTimeoutError";
  }
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 5_000,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new RequestTimeoutError(timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
