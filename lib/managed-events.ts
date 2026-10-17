import { db, execute } from './db';
import { canManageEvent, type EventManager } from './event-manager-auth';
import { easternTimeToIso } from './event-time';
import type { ClubEvent } from './types';
import { readEventRegistrationFields } from './event-registration';
import { storedEventPageCopy, validateEventPageCopy } from './event-page-copy';

export class EventError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export type ManagedEvent = ClubEvent & { revision: number; merchant_id: number; store_id: number };

export async function listManagedEvents(manager: EventManager) {
  const scope = manager.isSiteAdmin ? '' : 'WHERE m.merchant_id = ?' + (manager.storeId > 0 ? ' AND m.store_id = ?' : '');
  const args = manager.isSiteAdmin ? [] : manager.storeId > 0 ? [manager.merchantId, manager.storeId] : [manager.merchantId];
  const result = await execute(`SELECT e.*, m.merchant_id, m.store_id, COALESCE(m.revision, 0) AS revision,
    (SELECT updated_at FROM landing_page_assets WHERE slot = 'event-' || e.id) AS poster_updated_at
    FROM events e LEFT JOIN event_management m ON m.event_id = e.id ${scope} ORDER BY e.event_date DESC`, args);
  return result.rows as unknown as ManagedEvent[];
}

export function readEventFields(input: Record<string, unknown>) {
  const field = (key: string, max: number, required = false) => {
    const value = typeof input[key] === 'string' ? input[key].trim() : '';
    if ((required && !value) || value.length > max) throw new EventError('请检查标题、介绍、地点和分类的内容长度');
    return value;
  };
  const titleCn = field('titleCn', 300, true), descriptionCn = field('descriptionCn', 4000, true);
  const locationCn = field('locationCn', 500, true), categoryCn = field('categoryCn', 100, true);
  let start: string, end: string;
  try { start = easternTimeToIso(String(input.start || '')); end = easternTimeToIso(String(input.end || '')); }
  catch (error) { throw new EventError(error instanceof Error ? error.message : '请检查活动时间'); }
  if (end <= start) throw new EventError('结束时间必须晚于开始时间');
  const capacity = input.capacity === '' || input.capacity === undefined ? 0 : Number(input.capacity);
  if (!Number.isSafeInteger(capacity) || capacity < 0 || capacity > 100000) throw new EventError('人数请留空，或填写 1 至 100000 的整数');
  const status = String(input.status || 'draft');
  if (!['draft', 'upcoming', 'completed', 'cancelled'].includes(status)) throw new EventError('活动状态无效');
  if (status === 'upcoming' && start <= new Date().toISOString()) throw new EventError('发布的活动开始时间必须在未来');
  return {
    title: field('title', 300) || titleCn, description: field('description', 4000) || descriptionCn,
    location: field('location', 500) || locationCn, category: field('category', 100) || categoryCn,
    titleCn, descriptionCn, locationCn, categoryCn, start, end, capacity, status,
  };
}

async function readPoster(poster?: File | null) {
  if (!poster || !poster.size) return null;
  if (poster.size > 4 * 1024 * 1024) throw new EventError('海报不能超过 4MB');
  const bytes = new Uint8Array(await poster.arrayBuffer());
  const type = poster.type.toLowerCase();
  const valid = (type === 'image/png' && bytes.length > 8 && [137,80,78,71,13,10,26,10].every((n, i) => bytes[i] === n))
    || (type === 'image/jpeg' && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    || (type === 'image/webp' && new TextDecoder().decode(bytes.slice(0,4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8,12)) === 'WEBP');
  if (!valid) throw new EventError('请上传有效的 PNG、JPG 或 WebP 海报');
  return { bytes, type, name: poster.name.slice(0, 180) };
}

export async function saveManagedEvent(manager: EventManager, input: Record<string, unknown>, poster?: File | null) {
  const updating = Boolean(input.id);
  if (!(updating ? manager.canEdit : manager.canCreate)) throw new EventError('此账号没有新增或修改活动的权限', 403);
  const id = updating ? String(input.id) : crypto.randomUUID();
  if (!/^[A-Za-z0-9-]{1,100}$/.test(id)) throw new EventError('活动编号无效');
  const fields = readEventFields(input);
  const image = await readPoster(poster);
  const client = await db();
  const tx = await client.transaction('write');
  try {
    const current = await tx.execute({ sql: 'SELECT e.*, m.* FROM events e LEFT JOIN event_management m ON m.event_id = e.id WHERE e.id = ?', args: [id] });
    const row = current.rows[0];
    if (updating) {
      if (!row || !canManageEvent(manager, { merchant_id: row.merchant_id, store_id: row.store_id })) throw new EventError('无权修改这个活动', 403);
      if (Number(input.revision) !== Number(row.revision || 0)) throw new EventError('活动已被其他人更新，请重新打开后再修改', 409);
    }
    let registration, pageCopy, pageCopyCn;
    try {
      pageCopy = validateEventPageCopy(input.pageCopy ?? storedEventPageCopy(row?.page_copy));
      pageCopyCn = validateEventPageCopy(input.pageCopyCn ?? storedEventPageCopy(row?.page_copy_cn));
      registration = readEventRegistrationFields({
        registrationUrl: row?.registration_url, feeDetails: row?.fee_details, feeDetailsCn: row?.fee_details_cn,
        paymentInstructions: row?.payment_instructions, paymentInstructionsCn: row?.payment_instructions_cn,
        ...input,
      });
    } catch (error) { throw new EventError(error instanceof Error ? error.message : '请检查报名和收费说明'); }
    const now = new Date().toISOString();
    await tx.execute({ sql: `INSERT INTO events
      (id,title,description,event_date,end_date,location,category,capacity,status,title_cn,description_cn,location_cn,category_cn,
       registration_url,fee_details,fee_details_cn,payment_instructions,payment_instructions_cn,page_copy,page_copy_cn)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
      title=excluded.title,description=excluded.description,event_date=excluded.event_date,end_date=excluded.end_date,
      location=excluded.location,category=excluded.category,capacity=excluded.capacity,status=excluded.status,
      title_cn=excluded.title_cn,description_cn=excluded.description_cn,location_cn=excluded.location_cn,category_cn=excluded.category_cn,
      registration_url=excluded.registration_url,fee_details=excluded.fee_details,fee_details_cn=excluded.fee_details_cn,
      payment_instructions=excluded.payment_instructions,payment_instructions_cn=excluded.payment_instructions_cn,
      page_copy=excluded.page_copy,page_copy_cn=excluded.page_copy_cn`,
      args: [id,fields.title,fields.description,fields.start,fields.end,fields.location,fields.category,fields.capacity,fields.status,
        fields.titleCn,fields.descriptionCn,fields.locationCn,fields.categoryCn,registration.registrationUrl,
        registration.feeDetails,registration.feeDetailsCn,registration.paymentInstructions,registration.paymentInstructionsCn,
        JSON.stringify(pageCopy),JSON.stringify(pageCopyCn)] });
    await tx.execute({ sql: `INSERT INTO event_management (event_id,merchant_id,store_id,created_by,revision,updated_at)
      VALUES (?,?,?,?,1,?) ON CONFLICT(event_id) DO UPDATE SET revision=event_management.revision+1,updated_at=excluded.updated_at`,
      args: [id,manager.merchantId,manager.storeId,manager.id,now] });
    if (image) await tx.execute({ sql: `INSERT INTO landing_page_assets (slot,mime_type,file_name,data,updated_at) VALUES (?,?,?,?,?)
      ON CONFLICT(slot) DO UPDATE SET mime_type=excluded.mime_type,file_name=excluded.file_name,data=excluded.data,updated_at=excluded.updated_at`,
      args: [`event-${id}`,image.type,image.name,image.bytes,now] });
    await tx.execute({ sql: `INSERT INTO activity_logs (id,event_id,activity_type,description,actor_type,metadata,created_at)
      VALUES (?,?,?,?,?,?,?)`, args: [crypto.randomUUID(),id,updating?'event_updated':'event_created',
        `${updating?'Updated':'Created'} event: ${fields.title}`,manager.isSiteAdmin?'admin':'shop_manager',
        JSON.stringify({ actorId: manager.id, merchantId: manager.merchantId, storeId: manager.storeId, status: fields.status }),now] });
    await tx.commit();
    return { id, status: fields.status };
  } catch (error) { await tx.rollback(); throw error; }
  finally { tx.close(); }
}
