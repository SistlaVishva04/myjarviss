import { requireSecret } from "./env";

export const JWT_SECRET = requireSecret("JWT_SECRET");
