import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';

export type FuintAccount = {
  id: number; accountName: string; merchantId: number; storeId: number;
  accountStatus?: number; locked?: number;
};
export type FuintSession = { accountInfo: FuintAccount; roles: string[]; permissions: string[] };

export function readFuintSession(input: unknown): FuintSession | null {
  const data = input as FuintSession | null;
  const account = data?.accountInfo;
  if (!account || !Number.isSafeInteger(account.id) || account.id < 1
    || !Number.isSafeInteger(account.merchantId) || account.merchantId < 0
    || !Number.isSafeInteger(account.storeId) || account.storeId < 0
    || !Array.isArray(data.roles) || !data.roles.every(role => typeof role === 'string')
    || !Array.isArray(data.permissions) || !data.permissions.every(permission => typeof permission === 'string')
    || (account.accountStatus !== undefined && account.accountStatus !== 1)
    || (account.locked !== undefined && account.locked !== 0)) return null;
  // Keep only authorization claims; upstream account objects may contain private fields.
  return { accountInfo: { id: account.id, accountName: String(account.accountName || '管理员'),
    merchantId: account.merchantId, storeId: account.storeId,
    accountStatus: account.accountStatus, locked: account.locked }, roles: data.roles, permissions: data.permissions };
}

export function isPlatformAdministrator(session: FuintSession | null): boolean {
  return Boolean(session && session.accountInfo.merchantId === 0 && session.accountInfo.storeId === 0
    && session.accountInfo.accountStatus === 1 && session.accountInfo.locked === 0 && session.roles.includes('admin'));
}

export const getFuintSession = cache(async (): Promise<FuintSession | null> => {
  const token = (await cookies()).get('Access-Token')?.value;
  if (!token || token.length > 4096) return null;
  try {
    const base = process.env.FUINT_API_URL || process.env.NEXT_PUBLIC_FUINT_API || 'https://parsley-easiest-qualify.ngrok-free.dev';
    const response = await fetch(new URL('/backendApi/login/getInfo', base), {
      headers: { 'Access-Token': token, 'ngrok-skip-browser-warning': 'true' },
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.code === 200 ? readFuintSession(result.data) : null;
  } catch { return null; }
});
