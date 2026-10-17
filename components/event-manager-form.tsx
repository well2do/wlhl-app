'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import type { EventManager } from '@/lib/event-manager-auth';
import type { ManagedEvent } from '@/lib/managed-events';
import { easternTimeInput, eventHref } from '@/lib/event-time';
import { landingImageUrl } from '@/lib/landing-page-content';
import { EventRegistrationFields } from './event-registration-fields';
import { EventPageCopyFields } from './event-page-copy-fields';

const statuses: Record<string, string> = { draft: '草稿（仅后台可见）', upcoming: '上线（即将举行）', completed: '已结束', cancelled: '下线 / 取消' };
export function EventManagerForm({ initialEventId }: { initialEventId?: string }) {
  const [manager, setManager] = useState<EventManager | null>(null);
  const [events, setEvents] = useState<ManagedEvent[]>([]);
  const [selected, setSelected] = useState<ManagedEvent | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [preview, setPreview] = useState('');
  const [reset, setReset] = useState(0);
  const [publicLink, setPublicLink] = useState('');
  async function load() {
    const response = await fetch('/api/shop-manager/events', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    setManager(result.manager); setEvents(result.events);
    return result.events as ManagedEvent[];
  }
  useEffect(() => {
    load().then(items => {
      if (!initialEventId) return;
      const event = items.find(item => item.id === initialEventId);
      if (event) setSelected(event);
      else setError('找不到这个活动，或当前账号没有管理权限。');
    }).catch(error => setError(error.message)).finally(() => setLoaded(true));
  }, [initialEventId]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  function choose(event: ManagedEvent | null) {
    setSelected(event); setPreview(''); setError(''); setMessage(''); setPublicLink(''); setReset(value => value + 1);
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    const form = new FormData(event.currentTarget);
    const input = Object.fromEntries(form.entries());
    delete input.poster;
    const body = new FormData();
    const pageCopyFields = (prefix: string) => {
      const entries = Object.entries(input).filter(([key]) => key.startsWith(prefix));
      for (const [key] of entries) delete input[key];
      return entries.length ? Object.fromEntries(entries.map(([key, value]) => [key.slice(prefix.length), value])) : undefined;
    };
    const pageCopy = pageCopyFields('pageCopy:'), pageCopyCn = pageCopyFields('pageCopyCn:');
    body.set('event', JSON.stringify({ ...input, pageCopy, pageCopyCn, id: selected?.id, revision: selected?.revision }));
    const poster = form.get('poster');
    if (poster instanceof File && poster.size) body.set('poster', poster);
    try {
      const response = await fetch('/api/shop-manager/events', { method: 'POST', body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      const updated = await load();
      setSelected(updated.find(item => item.id === result.id) || null); setPreview('');
      const published = ['upcoming','completed'].includes(result.status);
      setMessage(published ? '活动已发布，前台内容已更新。' : '活动已保存；草稿或下线活动不会显示在前台。');
      setPublicLink(published ? eventHref(result.id, 'cn') : '');
    } catch (error) { setError(error instanceof Error ? error.message : '保存失败，请重试'); }
    finally { setBusy(false); }
  }
  return <main className="event-manager-page" lang="zh-CN">
    <nav><Link href="/wlhl-application/index.html">← 店铺后台</Link><Link href="/cn/events">查看网站活动日历</Link></nav>
    <h1>网站活动管理</h1>
    <p>填写活动资料、上传海报，选择“上线（即将举行）”并保存，即可显示在活动日历；最近的一场活动也会显示在首页。</p>
    {error && <p role="alert" className="form-error">{error}</p>}
    {!loaded && <p role="status">正在核对登录信息…</p>}
    {loaded && !manager && <p><Link className="button button-dark" href="/wlhl-application/index.html#/login">登录店铺后台</Link> <Link href="/admin/login">网站管理员登录</Link></p>}
    {manager && <>
      <p>当前账号：{manager.name} · {manager.isSiteAdmin ? '管理所有商户的活动和网页' : manager.storeId ? '仅管理本店活动' : '管理俱乐部活动'}</p>
      <section className="event-editor-help" aria-label="网页内容编辑入口">
        <h2>网页上的文字在哪里改？</h2>
        <p>先选择左侧活动。“活动介绍 / 流程”修改正文；“活动网页文字”修改栏目标题、按钮和提示语。海报图片里的字需要修改图片后重新上传。</p>
        <nav aria-label="其他网页文字编辑">
          <Link href="/admin/pages?page=events&locale=cn">编辑活动日历页面文字</Link>
          <Link href="/admin/landing-page-editor?locale=cn">编辑网站顶部导航和页脚</Link>
        </nav>
        <small>这两个入口会修改多个活动共用的页面，需要网站管理员登录。</small>
      </section>
      {message && <p role="status" className="event-save-message">{message} {publicLink && <Link href={publicLink} target="_blank">查看已发布活动 →</Link>}</p>}
      <div className="event-manager-grid">
        <aside>
          <button className="button button-dark" disabled={!manager.canCreate || busy} onClick={() => choose(null)}>＋ 新增活动</button>
          <ul>{events.map(event => <li key={event.id}>
            <strong>{event.title_cn || event.title}</strong>
            <span>{easternTimeInput(event.event_date).replace('T',' ')} · {statuses[event.status]}</span>
            {manager.isSiteAdmin && <span>{event.merchant_id == null ? '历史活动（未分配商户）' : `商户 ${event.merchant_id} · ${event.store_id ? `店铺 ${event.store_id}` : '商户统一活动'}`}</span>}
            <button type="button" disabled={!manager.canEdit || busy} onClick={() => choose(event)}>编辑活动</button>
            {['upcoming','completed'].includes(event.status) && <Link href={eventHref(event.id,'cn')} target="_blank">查看前台</Link>}
          </li>)}</ul>
          {events.length === 0 && <p>暂无活动。点击新增活动开始发布。</p>}
        </aside>
        <form className="stack-form event-manager-editor" key={`${selected?.id || 'new'}-${selected?.revision || 0}-${reset}`} onSubmit={save}>
          <h2>{selected ? '编辑活动' : '新增活动'}</h2>
          <fieldset disabled={busy || (selected ? !manager.canEdit : !manager.canCreate)}>
            <label>活动标题<input name="titleCn" required maxLength={300} defaultValue={selected?.title_cn || selected?.title} /></label>
            <label>活动介绍 / 流程<textarea name="descriptionCn" required maxLength={4000} rows={6} defaultValue={selected?.description_cn || selected?.description} /></label>
            <div className="form-row two-columns">
              <label>开始时间（美国东部时间）<input name="start" type="datetime-local" required defaultValue={selected ? easternTimeInput(selected.event_date) : ''} /></label>
              <label>结束时间（美国东部时间）<input name="end" type="datetime-local" required defaultValue={selected?.end_date ? easternTimeInput(selected.end_date) : ''} /></label>
            </div>
            <label>地点及地址<input name="locationCn" required maxLength={500} defaultValue={selected?.location_cn || selected?.location} /></label>
            <h3>报名登记与收费</h3>
            <EventRegistrationFields event={selected} locale="cn" />
            {selected?.id === 'forum-2026-09-07' ? <p>这场论坛使用独立网页，请由网站管理员前往 <Link href="/admin/pages?page=forum&locale=cn">论坛网页文字编辑</Link> 修改栏目文字。</p> : <section id="event-page-copy" className="event-page-copy-editor">
              <h3>活动网页文字</h3>
              <p>修改此活动详情页的标题、按钮和说明。费用金额、付款账号仍在上方“报名登记与收费”中修改。保存活动后生效。</p>
              <EventPageCopyFields value={selected?.page_copy_cn} locale="cn" />
            </section>}
            <div className="form-row two-columns">
              <label>分类<input name="categoryCn" required maxLength={100} defaultValue={selected?.category_cn || selected?.category || '社区活动'} /></label>
              <label>计划人数（选填）<input name="capacity" type="number" min={1} max={100000} defaultValue={selected?.capacity || ''} placeholder="未确定可留空" /></label>
            </div>
            <label>活动海报（PNG / JPG / WebP，最大 4MB）<input name="poster" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => {
              const file = event.currentTarget.files?.[0];
              if (file && file.size > 4 * 1024 * 1024) { setError('海报不能超过 4MB'); event.currentTarget.value = ''; setPreview(''); return; }
              setError(''); setPreview(file ? URL.createObjectURL(file) : '');
            }} /></label>
            {(preview || selected?.poster_updated_at) && <img className="event-manager-poster" src={preview || landingImageUrl(`event-${selected!.id}`, selected!.poster_updated_at)} alt="活动海报预览" />}
            {selected?.poster_updated_at && <small>不选择新图片将保留现有海报。</small>}
            <details><summary>英文内容（选填；留空则使用中文内容）</summary>
              <label>English title<input name="title" maxLength={300} defaultValue={selected?.title} /></label>
              <label>English description<textarea name="description" rows={4} maxLength={4000} defaultValue={selected?.description} /></label>
              <label>English location<input name="location" maxLength={500} defaultValue={selected?.location} /></label>
              <label>English category<input name="category" maxLength={100} defaultValue={selected?.category} /></label>
              <EventRegistrationFields event={selected} locale="en" includeLink={false} />
              {selected?.id !== 'forum-2026-09-07' && <details><summary>英文活动网页文字</summary><EventPageCopyFields value={selected?.page_copy} locale="en" /></details>}
            </details>
            <label>发布状态<select name="status" defaultValue={selected?.status || 'draft'}>{Object.entries(statuses).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <button className="button button-dark" type="submit">{busy ? '正在保存…' : '保存活动'}</button>
          </fieldset>
        </form>
      </div>
    </>}
  </main>;
}
