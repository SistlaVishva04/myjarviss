const LOCAL_ORIGINS = ["http://localhost:5173", "http://localhost:8080"];
const PRODUCTION_ORIGIN = "https://myvishva.netlify.app";

export function normalizeOrigin(value: string): string {
  const parsed = new URL(value.trim());
  if (
    (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error("CLIENT_ORIGIN must be an HTTP(S) origin without a path");
  }

  return parsed.origin;
}

export function getAllowedOrigins(clientOrigin?: string): Set<string> {
  return new Set([
    ...LOCAL_ORIGINS,
    PRODUCTION_ORIGIN,
    clientOrigin ? normalizeOrigin(clientOrigin) : "http://localhost:5173",
  ]);
}
