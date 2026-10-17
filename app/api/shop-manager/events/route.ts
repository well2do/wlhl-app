import { revalidatePath } from 'next/cache';
import { getEventManager } from '@/lib/event-manager-auth';
import { EventError, listManagedEvents, saveManagedEvent } from '@/lib/managed-events';

const noStore = { 'Cache-Control': 'no-store' };
export async function GET() {
  const manager = await getEventManager();
  if (!manager) return Response.json({ error: '请先登录部门后台，并确认账号有内容管理权限' }, { status: 401, headers: noStore });
  return Response.json({ manager, events: await listManagedEvents(manager) }, { headers: noStore });
}

export async function POST(request: Request) {
  let sameOrigin = false;
  try {
    const origin = new URL(request.headers.get('origin') || '');
    // Next may normalize request.url to the listener hostname behind a proxy.
    // Host is the browser's destination and cannot be set by cross-origin forms.
    sameOrigin = ['https:', 'http:'].includes(origin.protocol)
      && origin.host === (request.headers.get('host') || new URL(request.url).host);
  } catch { /* Missing and opaque origins cannot write events. */ }
  if (!sameOrigin) return Response.json({ error: '请求来源无效' }, { status: 403 });
  const manager = await getEventManager();
  if (!manager) return Response.json({ error: '登录已失效或没有内容管理权限，请重新登录部门后台' }, { status: 401, headers: noStore });
  if (Number(request.headers.get('content-length') || 0) > 4.4 * 1024 * 1024) return Response.json({ error: '海报不能超过 4MB' }, { status: 413 });
  try {
    const form = await request.formData();
    let input;
    try { input = JSON.parse(String(form.get('event'))); } catch { throw new EventError('活动信息格式无效'); }
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new EventError('活动信息格式无效');
    const file = form.get('poster');
    const saved = await saveManagedEvent(manager, input, file instanceof File ? file : null);
    revalidatePath('/', 'layout');
    return Response.json(saved, { headers: noStore });
  } catch (error) {
    return Response.json({ error: error instanceof EventError ? error.message : '保存失败，请稍后重试' }, { status: error instanceof EventError ? error.status : 500, headers: noStore });
  }
}
