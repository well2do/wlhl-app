import { createCopy } from "@/lib/page-copy";
import { getPageCopy } from "@/lib/page-copy-store";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getEvents, getPastEvents } from "@/lib/db";
import { EventList } from "@/components/event-list";

export const metadata = { title: "活动日历" };

export default async function ChineseEventsPage() {
  const copyText = createCopy(await getPageCopy("events", "cn"));
  const [events, pastEvents] = await Promise.all([getEvents(), getPastEvents()]);
  return (
    <>
      <SiteHeader locale="cn" />
      <main lang="zh-CN">
        <section className="page-hero events-hero"><div><p className="eyebrow eyebrow-light">{copyText("俱乐部活动日历")}</p><h1>{copyText("让每一次相聚")}<br /><em>{copyText("都滋养身心。")}</em></h1><p>{copyText("轻松前来，带着更多力量、知识与连接回家。")}</p></div></section>
        <section className="section event-list-section">
          <div className="section-heading split-heading compact-heading"><div><p className="eyebrow">{copyText("即将举行")}</p><h2>{copyText("报名登记")}</h2></div><p>{copyText("打开活动详情查看费用和付款方式，并完成报名登记。")}</p></div>
          <EventList events={events} locale="cn" linkLabel={copyText("报名登记")} />
          {events.length === 0 && <div className="empty-state"><CalendarDays size={30} /><h3>{copyText("新的活动即将发布。")}</h3><p>{copyText("请在首页开启通知，活动发布时我们会第一时间告诉您。")}</p></div>}
        </section>
        {pastEvents.length > 0 && <section className="section event-list-section" id="past-events" aria-labelledby="past-events-heading">
          <div className="section-heading split-heading compact-heading"><div><p className="eyebrow">{copyText("会议纪要与活动回顾")}</p><h2 id="past-events-heading">{copyText("历史活动")}</h2></div><p>{copyText("按活动日期由新到旧排列，打开详情查看完整记录。")}</p></div>
          <EventList events={pastEvents} locale="cn" linkLabel={copyText("查看活动记录")} />
        </section>}
        <section className="simple-cta"><div><p className="eyebrow eyebrow-light">{copyText("成为社区的一员")}</p><h2>{copyText("归属感，从")}<br /><em>{copyText("每一次参与开始。")}</em></h2></div><Link className="button button-coral" href="/cn/join">{copyText("加入俱乐部 ")}<ArrowRight size={17} /></Link></section>
      </main>
      <SiteFooter locale="cn" />
    </>
  );
}
