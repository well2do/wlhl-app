import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { issueSession, sessionLifetime, sessionSecret, verifySession, type SessionRole } from "./session-token";
import { getFuintSession, isPlatformAdministrator } from "./fuint-session";

const ADMIN_COOKIE = "wlhl_admin";
const MEMBER_COOKIE = "wlhl_member";

function encode(value: string, role: SessionRole) {
  const secret = sessionSecret();
  if (!secret) throw new Error("Session signing is not configured.");
  return issueSession(value, role, secret);
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: sessionLifetime,
};

export async function createAdminSession() {
  (await cookies()).set(ADMIN_COOKIE, encode("admin", "admin"), cookieOptions);
}

export async function clearAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
  (await cookies()).delete("Access-Token");
}

export async function hasWebsiteAdminSession() {
  return verifySession((await cookies()).get(ADMIN_COOKIE)?.value, "admin", sessionSecret()) === "admin";
}

export async function isAdmin() {
  return await hasWebsiteAdminSession() || isPlatformAdministrator(await getFuintSession());
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function createMemberSession(memberId: string) {
  (await cookies()).set(MEMBER_COOKIE, encode(memberId, "member"), cookieOptions);
}

export async function clearMemberSession() {
  (await cookies()).delete(MEMBER_COOKIE);
}

export async function getMemberSession() {
  return verifySession((await cookies()).get(MEMBER_COOKIE)?.value, "member", sessionSecret());
}
