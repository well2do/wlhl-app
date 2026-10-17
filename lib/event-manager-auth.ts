import { hasWebsiteAdminSession } from "./auth";
import { getFuintSession, isPlatformAdministrator, readFuintSession } from "./fuint-session";

export type EventManager = {
  id: string; name: string; merchantId: number; storeId: number;
  isSiteAdmin: boolean; canCreate: boolean; canEdit: boolean;
};

export function managerFromAccount(data: unknown): EventManager | null {
  const info = readFuintSession(data);
  if (isPlatformAdministrator(info)) return {
    id: `fuint:${info!.accountInfo.id}`, name: `${info!.accountInfo.accountName}（系统管理员）`,
    merchantId: Number(process.env.FUINT_MERCHANT_ID || 1), storeId: 0, isSiteAdmin: true, canCreate: true, canEdit: true,
  };
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
  if (await hasWebsiteAdminSession()) return { id: "site-admin", name: "网站管理员", merchantId: Number(process.env.FUINT_MERCHANT_ID || 1), storeId: 0, isSiteAdmin: true, canCreate: true, canEdit: true };
  return managerFromAccount(await getFuintSession());
}

export function canManageEvent(manager: EventManager, ownership?: { merchant_id: unknown; store_id: unknown }) {
  return manager.isSiteAdmin || Boolean(ownership && Number(ownership.merchant_id) === manager.merchantId
    && (manager.storeId === 0 || Number(ownership.store_id) === manager.storeId));
}
