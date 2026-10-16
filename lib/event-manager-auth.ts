import { cookies } from "next/headers";
import { isAdmin } from "./auth";

export type EventManager = {
  id: string; name: string; merchantId: number; storeId: number;
  isSiteAdmin: boolean; canCreate: boolean; canEdit: boolean;
};

export function managerFromAccount(data: unknown): EventManager | null {
  const info = data as { accountInfo?: Record<string, unknown>; roles?: string[]; permissions?: string[] } | null;
  const account = info?.accountInfo;
  if (!account || !Array.isArray(info?.roles) || !info.roles.some((role) => ["admin", "common"].includes(role))
    || !Array.isArray(info.permissions) || !Number.isSafeInteger(account.id) || Number(account.id) < 1
    || account.merchantId !== Number(process.env.FUINT_MERCHANT_ID || 1)
    || !Number.isSafeInteger(account.storeId) || Number(account.storeId) < 0) return null;
  const permitted = (permission: string) => info.permissions!.includes("*:*:*") || info.permissions!.includes(permission);
  if (!permitted("content:article:index")) return null;
  return {
    id: `fuint:${account.id}`, name: String(account.accountName || "店铺管理员"),
    merchantId: Number(account.merchantId), storeId: Number(account.storeId), isSiteAdmin: false,
    canCreate: permitted("content:article:add"), canEdit: permitted("content:article:edit"),
  };
}

export async function getEventManager(): Promise<EventManager | null> {
  if (await isAdmin()) return { id: "site-admin", name: "网站管理员", merchantId: Number(process.env.FUINT_MERCHANT_ID || 1), storeId: 0, isSiteAdmin: true, canCreate: true, canEdit: true };
  const token = (await cookies()).get("Access-Token")?.value;
  if (!token || token.length > 4096) return null;
  try {
    const base = process.env.FUINT_API_URL || process.env.NEXT_PUBLIC_FUINT_API || "https://parsley-easiest-qualify.ngrok-free.dev";
    const response = await fetch(new URL("/backendApi/login/getInfo", base), {
      headers: { "Access-Token": token, "ngrok-skip-browser-warning": "true" },
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.code === 200 ? managerFromAccount(result.data) : null;
  } catch { return null; }
}

export function canManageEvent(manager: EventManager, ownership?: { merchant_id: unknown; store_id: unknown }) {
  return manager.isSiteAdmin || Boolean(ownership && Number(ownership.merchant_id) === manager.merchantId
    && (manager.storeId === 0 || Number(ownership.store_id) === manager.storeId));
}
