import "dotenv/config";

export function requireEnv(
  name: string,
  environment: NodeJS.ProcessEnv = process.env,
): string {
  const value = environment[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function requireSecret(
  name: string,
  environment: NodeJS.ProcessEnv = process.env,
): string {
  const secret = requireEnv(name, environment);
  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error(`${name} must be at least 32 bytes long`);
  }
  return secret;
}
