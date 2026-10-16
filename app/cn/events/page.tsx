import { eventHref } from "@/lib/event-time";
import { landingImageUrl } from "@/lib/landing-page-content";
import { createCopy } from "@/lib/page-copy";
import { getPageCopy } from "@/lib/page-copy-store";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, MapPin, Users } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { chineseEvent, formatChineseEventDate, formatChineseEventTime } from "@/lib/chinese";
import { getEvents } from "@/lib/db";

export const metadata = { title: "活动日历" };

export default async function ChineseEventsPage() {
  const copyText = createCopy(await getPageCopy("events", "cn"));
  const events = (await getEvents()).map(chineseEvent);
  return (
    <>
      <SiteHeader locale="cn" />
      <main lang="zh-CN">
        <section className="page-hero events-hero"><div><p className="eyebrow eyebrow-light">{copyText("俱乐部活动日历")}</p><h1>{copyText("让每一次相聚")}<br /><em>{copyText("都滋养身心。")}</em></h1><p>{copyText("轻松前来，带着更多力量、知识与连接回家。")}</p></div></section>
        <section className="section event-list-section">
          <div className="section-heading split-heading compact-heading"><div><p className="eyebrow">{copyText("即将举行")}</p><h2>{copyText("预约您的席位。")}</h2></div><p>{copyText("会员可以通过个人会员中心预约。第一次来到这里？几分钟即可申请加入俱乐部。")}</p></div>
          <div className="event-list">{events.map((event, index) => <article className="event-row" key={event.id}>
            <div className="event-date-block"><strong>{new Date(event.event_date).toLocaleDateString("zh-CN", { timeZone: "America/New_York", day: "2-digit" })}</strong><span>{new Date(event.event_date).toLocaleDateString("zh-CN", { timeZone: "America/New_York", month: "short" })}</span></div>
            <div className={`event-list-art art-tone-${(index % 3) + 1} ${event.poster_updated_at ? "has-event-poster" : ""}`}>{event.poster_updated_at ? <Link href={eventHref(event.id, "cn")}><img src={landingImageUrl(`event-${event.id}`, event.poster_updated_at)} alt={event.title} /></Link> : <span>{event.category}</span>}</div>
            <div className="event-row-copy"><small>{event.category}</small><h3><Link href={eventHref(event.id, "cn")}>{event.title}</Link></h3><p>{event.description}</p><div className="event-inline-meta"><span><CalendarDays size={15} />{formatChineseEventDate(event.event_date)}</span><span><Clock3 size={15} />{formatChineseEventTime(event.event_date)}{event.end_date && ` – ${formatChineseEventTime(event.end_date)}`}</span><span><MapPin size={15} />{event.location}</span>{event.capacity > 0 && <span><Users size={15} />{event.attendee_count || 0}/{event.capacity}</span>}</div></div>
            <Link className="round-link" href={eventHref(event.id, "cn")} aria-label={`预约${event.title}`}><ArrowRight size={20} /></Link>
          </article>)}</div>
          {events.length === 0 && <div className="empty-state"><CalendarDays size={30} /><h3>{copyText("新的活动即将发布。")}</h3><p>{copyText("请在首页开启通知，活动发布时我们会第一时间告诉您。")}</p></div>}
        </section>
        <section className="simple-cta"><div><p className="eyebrow eyebrow-light">{copyText("成为社区的一员")}</p><h2>{copyText("归属感，从")}<br /><em>{copyText("每一次参与开始。")}</em></h2></div><Link className="button button-coral" href="/cn/join">{copyText("加入俱乐部 ")}<ArrowRight size={17} /></Link></section>
      </main>
      <SiteFooter locale="cn" />
    </>
  );
}
