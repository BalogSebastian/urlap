import crypto from "crypto";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "dev-admin-secret-change-me";

type TokenPurpose = "session" | "password";

interface BaseTokenPayload {
  purpose: TokenPurpose;
  exp: number;
}

interface SessionPayload extends BaseTokenPayload {
  sub: "admin";
}

interface PasswordPayload extends BaseTokenPayload {
  email: string;
}

type AnyPayload = SessionPayload | PasswordPayload;

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

export function signToken(payload: AnyPayload): string {
  const json = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(json);

  const signature = crypto
    .createHmac("sha256", ADMIN_SECRET)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

export function verifyToken<T extends AnyPayload>(rawToken: string, expectedPurpose: TokenPurpose): T | null {
  const parts = rawToken.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;

  const expectedSignature = crypto
    .createHmac("sha256", ADMIN_SECRET)
    .update(payloadB64)
    .digest("base64url");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const json = base64UrlDecode(payloadB64);
    const payload = JSON.parse(json) as T;

    if (payload.purpose !== expectedPurpose) return null;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, hashed: string): boolean {
  const [salt, hash] = hashed.split(":");
  const verifyHash = crypto.pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verifyHash, "hex"));
}

