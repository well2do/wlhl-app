import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "wlhl_admin";
const MEMBER_COOKIE = "wlhl_member";

function secret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "wlhl-local-development-secret";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function encode(value: string) {
  return `${value}.${sign(value)}`;
}

function decode(value?: string) {
  if (!value) return null;
  const separator = value.lastIndexOf(".");
  if (separator < 1) return null;
  const payload = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const expected = sign(payload);
  if (signature.length !== expected.length) return null;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) ? payload : null;
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export async function createAdminSession() {
  (await cookies()).set(ADMIN_COOKIE, encode("admin"), cookieOptions);
}

export async function clearAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdmin() {
  return decode((await cookies()).get(ADMIN_COOKIE)?.value) === "admin";
}

export async function createMemberSession(memberId: string) {
  (await cookies()).set(MEMBER_COOKIE, encode(memberId), cookieOptions);
}

export async function clearMemberSession() {
  (await cookies()).delete(MEMBER_COOKIE);
}

export async function getMemberSession() {
  return decode((await cookies()).get(MEMBER_COOKIE)?.value);
}
