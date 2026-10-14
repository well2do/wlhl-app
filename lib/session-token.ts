import { createHmac, timingSafeEqual } from "node:crypto";

export type SessionRole = "admin" | "member";
export const sessionLifetime = 60 * 60 * 24 * 30;

export function sessionSecret(env: NodeJS.ProcessEnv = process.env) {
  return env.SESSION_SECRET || env.ADMIN_PASSWORD
    || (env.NODE_ENV !== "production" ? "wlhl-local-development-secret" : null);
}

export function issueSession(subject: string, role: SessionRole, secret: string, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ subject, role, expires: Math.floor(now / 1000) + sessionLifetime })).toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("hex")}`;
}

export function verifySession(token: string | undefined, role: SessionRole, secret: string | null, now = Date.now()) {
  if (!token || !secret || token.length > 2048) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || extra !== undefined || !/^[a-f0-9]{64}$/.test(signature ?? "")) return null;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (value.role !== role || typeof value.subject !== "string" || !value.subject
      || !Number.isSafeInteger(value.expires) || value.expires <= Math.floor(now / 1000)) return null;
    return value.subject as string;
  } catch {
    return null;
  }
}
