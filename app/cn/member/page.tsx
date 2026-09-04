import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Leaf,
  LogOut,
  MapPin,
  Sparkles,
  Trophy,
} from "lucide-react";
import { memberLoginAction, memberLogoutAction, registerForEventAction } from "@/app/actions";
import { Brand } from "@/components/brand";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getMemberSession } from "@/lib/auth";
import { chineseAnnouncement, chineseEvent, chineseEventTitle, formatChineseEventDate, formatChineseEventTime } from "@/lib/chinese";
import { getAnnouncements, getEvents, getMember, getMemberAttendance } from "@/lib/db";

export const metadata = { title: "会员中心" };

const statusText: Record<string, string> = { pending: "待审核", active: "有效", paused: "已暂停", registered: "已预约", attended: "已参加", completed: "已完成" };
const interestText: Record<string, string> = { Movement: "运动健身", Nutrition: "营养健康", "Healthy aging": "健康长寿", Mindfulness: "正念生活", "Community outings": "社区活动", "Wellness products": "健康产品" };

export default async function ChineseMemberPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const memberId = await getMemberSession();
  const member = memberId ? await getMember(memberId) : null;
  const params = await searchParams;

  if (!member) {
    return (
      <main className="access-page" lang="zh-CN">
        <div className="access-brand"><Brand href="/cn" /></div>
        <section className="access-card">
          <span className="access-icon"><Leaf size={27} /></span>
          <p className="eyebrow">欢迎回来</p>
          <h1>您的健康生活，<br /><em>尽在会员中心。</em></h1>
          <p>请使用会员申请中填写的电子邮箱和手机号码。</p>
          <form action={memberLoginAction} className="stack-form">
            <input type="hidden" name="returnTo" value="/cn/member" />
            <label>电子邮箱<input type="email" name="email" autoComplete="email" required /></label>
            <label>手机号码后四位<input name="phoneLastFour" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} required /></label>
            {params.error && <p className="form-error">{params.error}</p>}
            <button className="button button-dark button-full">进入会员中心 <ArrowRight size={17} /></button>
          </form>
          <p className="access-help">还不是会员？ <Link href="/cn/join">申请加入 CAUCC</Link></p>
          <div className="member-login-language"><LanguageSwitcher locale="cn" /></div>
        </section>
      </main>
    );
  }

  const [rawEvents, attendance, rawAnnouncements] = await Promise.all([getEvents(), getMemberAttendance(member.id), getAnnouncements(2)]);
  const events = rawEvents.map(chineseEvent);
  const announcements = rawAnnouncements.map(chineseAnnouncement);
  const attendanceMap = new Map(attendance.map((item) => [item.event_id, item]));
  const completedCount = attendance.filter((item) => item.status === "completed" || item.status === "attended").length;
  const topInterest = member.interests.split(",")[0]?.trim() || "健康生活";

  return (
    <div className="portal-shell" lang="zh-CN">
      <header className="portal-header">
        <Brand href="/cn" />
        <div className="portal-header-actions"><LanguageSwitcher locale="cn" /><Link href="/cn">俱乐部网站</Link><form action={memberLogoutAction}><input type="hidden" name="returnTo" value="/cn" /><button aria-label="退出登录"><LogOut size={18} /></button></form></div>
      </header>
      <main className="portal-main">
        <section className="member-welcome"><div><p className="eyebrow">会员中心</p><h1>很高兴见到您，<em>{member.first_name}。</em></h1><p>以下是俱乐部最近的活动与消息。</p></div><div className={`status-badge status-${member.membership_status}`}><span />{statusText[member.membership_status]}会员</div></section>

        <section className="member-stat-grid">
          <div><span className="member-stat-icon coral"><CalendarCheck2 size={22} /></span><p><strong>{attendance.length}</strong><small>已预约活动</small></p></div>
          <div><span className="member-stat-icon gold"><Trophy size={22} /></span><p><strong>{completedCount}</strong><small>已完成活动</small></p></div>
          <div className="member-interest-stat"><span className="member-stat-icon green"><Sparkles size={22} /></span><p><strong>{interestText[topInterest] || topInterest}</strong><small>首要兴趣</small></p></div>
        </section>

        <div className="portal-columns">
          <section className="portal-panel portal-events">
            <div className="panel-heading"><div><p className="eyebrow">即将举行</p><h2>您的下一次精彩体验</h2></div><Link href="/cn/events">完整日历 <ArrowRight size={15} /></Link></div>
            <div className="portal-event-list">{events.slice(0, 3).map((event) => {
              const record = attendanceMap.get(event.id);
              return <article key={event.id} className="portal-event">
                <div className="portal-event-date"><strong>{new Date(event.event_date).toLocaleDateString("zh-CN", { timeZone: "America/New_York", day: "2-digit" })}</strong><span>{new Date(event.event_date).toLocaleDateString("zh-CN", { timeZone: "America/New_York", month: "short" })}</span></div>
                <div className="portal-event-info"><small>{event.category}</small><h3>{event.title}</h3><p><Clock3 size={14} />{formatChineseEventTime(event.event_date)} <span>·</span> <MapPin size={14} />{event.location}</p></div>
                {record ? <span className="reserved-chip"><CheckCircle2 size={14} />{statusText[record.status] || record.status}</span> : member.membership_status !== "active" ? <span className="approval-chip">等待会员审核</span> : <form action={registerForEventAction}><input type="hidden" name="eventId" value={event.id} /><button className="button button-outline button-small">预约</button></form>}
              </article>;
            })}</div>
          </section>

          <aside className="portal-panel member-news"><div className="panel-heading"><div><p className="eyebrow">公告栏</p><h2>俱乐部消息</h2></div></div>{announcements.map((item) => <article key={item.id}><span className={`news-kind news-${item.kind}`}>{item.kind === "event" ? "活动" : item.kind === "promotion" ? "优惠" : "社区"}</span><h3>{item.title}</h3><p>{item.message}</p></article>)}</aside>
        </div>

        <section className="portal-panel history-panel">
          <div className="panel-heading"><div><p className="eyebrow">您的健康旅程</p><h2>活动记录</h2></div></div>
          {attendance.length ? <div className="history-list">{attendance.map((item) => <div key={item.id}><span className={`history-check history-${item.status}`}><CheckCircle2 size={16} /></span><div><strong>{chineseEventTitle(item.event_title || "活动")}</strong><small>{item.event_date ? formatChineseEventDate(item.event_date, true) : ""}</small></div><span className="history-status">{statusText[item.status] || item.status}</span></div>)}</div> : <div className="empty-state compact-empty"><CalendarDays size={26} /><h3>您的第一场活动正在等您。</h3><p>在上方预约活动后，记录会显示在这里。</p></div>}
        </section>
      </main>
    </div>
  );
}
