import Link from "next/link";
import { redirect } from "next/navigation";
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
import { getAnnouncements, getEvents, getMember, getMemberAttendance } from "@/lib/db";
import { formatEventDate, formatEventTime } from "@/lib/format";

export const metadata = { title: "Member Home" };

export default async function MemberPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const memberId = await getMemberSession();
  const member = memberId ? await getMember(memberId) : null;
  const params = await searchParams;

  if (!member) {
    return (
      <main className="access-page">
        <div className="access-brand"><Brand /></div>
        <section className="access-card">
          <span className="access-icon"><Leaf size={27} /></span>
          <p className="eyebrow">Welcome back</p>
          <h1>Your healthy life,<br /><em>all in one place.</em></h1>
          <p>Use the email and mobile number from your membership application.</p>
          <form action={memberLoginAction} className="stack-form">
            <input type="hidden" name="returnTo" value="/member" />
            <label>Email address<input type="email" name="email" autoComplete="email" required /></label>
            <label>Last 4 digits of mobile number<input name="phoneLastFour" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} required /></label>
            {params.error && <p className="form-error">{params.error}</p>}
            <button className="button button-dark button-full">Open my member home <ArrowRight size={17} /></button>
          </form>
          <p className="access-help">Not a member yet? <Link href="/join">Join CAUCC</Link></p>
        </section>
      </main>
    );
  }

  const [events, attendance, announcements] = await Promise.all([getEvents(), getMemberAttendance(member.id), getAnnouncements(2)]);
  const attendanceMap = new Map(attendance.map((item) => [item.event_id, item]));
  const completedCount = attendance.filter((item) => item.status === "completed" || item.status === "attended").length;

  return (
    <div className="portal-shell">
      <header className="portal-header">
        <Brand />
        <div className="portal-header-actions"><LanguageSwitcher locale="en" /><Link href="/">Club website</Link><form action={memberLogoutAction}><input type="hidden" name="returnTo" value="/" /><button aria-label="Sign out"><LogOut size={18} /></button></form></div>
      </header>
      <main className="portal-main">
        <section className="member-welcome">
          <div><p className="eyebrow">Member home</p><h1>Good to see you, <em>{member.first_name}.</em></h1><p>Here’s what’s happening around the club.</p></div>
          <div className={`status-badge status-${member.membership_status}`}><span />{member.membership_status} membership</div>
        </section>

        <section className="member-stat-grid">
          <div><span className="member-stat-icon coral"><CalendarCheck2 size={22} /></span><p><strong>{attendance.length}</strong><small>Events reserved</small></p></div>
          <div><span className="member-stat-icon gold"><Trophy size={22} /></span><p><strong>{completedCount}</strong><small>Events completed</small></p></div>
          <div className="member-interest-stat"><span className="member-stat-icon green"><Sparkles size={22} /></span><p><strong>{member.interests.split(",")[0] || "Wellness"}</strong><small>Top interest</small></p></div>
        </section>

        <div className="portal-columns">
          <section className="portal-panel portal-events">
            <div className="panel-heading"><div><p className="eyebrow">Coming up</p><h2>Your next opportunity</h2></div><Link href="/events">Full calendar <ArrowRight size={15} /></Link></div>
            <div className="portal-event-list">
              {events.slice(0, 3).map((event) => {
                const record = attendanceMap.get(event.id);
                return (
                  <article key={event.id} className="portal-event">
                    <div className="portal-event-date"><strong>{new Date(event.event_date).toLocaleDateString("en-US", { timeZone: "America/New_York", day: "2-digit" })}</strong><span>{new Date(event.event_date).toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short" })}</span></div>
                    <div className="portal-event-info"><small>{event.category}</small><h3>{event.title}</h3><p><Clock3 size={14} />{formatEventTime(event.event_date)} <span>·</span> <MapPin size={14} />{event.location}</p></div>
                    {record ? <span className="reserved-chip"><CheckCircle2 size={14} />{record.status}</span> : member.membership_status !== "active" ? (
                      <span className="approval-chip">Approval pending</span>
                    ) : (
                      <form action={registerForEventAction}>
                        <input type="hidden" name="eventId" value={event.id} />
                        <button className="button button-outline button-small">Reserve</button>
                      </form>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="portal-panel member-news">
            <div className="panel-heading"><div><p className="eyebrow">Notice board</p><h2>Club news</h2></div></div>
            {announcements.map((item) => <article key={item.id}><span className={`news-kind news-${item.kind}`}>{item.kind}</span><h3>{item.title}</h3><p>{item.message}</p></article>)}
          </aside>
        </div>

        <section className="portal-panel history-panel">
          <div className="panel-heading"><div><p className="eyebrow">Your journey</p><h2>Event history</h2></div></div>
          {attendance.length ? (
            <div className="history-list">{attendance.map((item) => <div key={item.id}><span className={`history-check history-${item.status}`}><CheckCircle2 size={16} /></span><div><strong>{item.event_title}</strong><small>{item.event_date ? formatEventDate(item.event_date, true) : ""}</small></div><span className="history-status">{item.status}</span></div>)}</div>
          ) : (
            <div className="empty-state compact-empty"><CalendarDays size={26} /><h3>Your first event is waiting.</h3><p>Reserve one above and it’ll appear here.</p></div>
          )}
        </section>
      </main>
    </div>
  );
}
