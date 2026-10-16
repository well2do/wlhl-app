import Link from "next/link";
import { notFound } from "next/navigation";
import { execute } from "@/lib/db";
import type { ClubEvent } from "@/lib/types";
import { chineseEvent, formatChineseEventDate, formatChineseEventTime } from "@/lib/chinese";
import { formatEventDate, formatEventTime } from "@/lib/format";
import { landingImageUrl } from "@/lib/landing-page-content";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { PosterLightbox } from "./poster-lightbox";
import { safeEventRegistrationUrl } from "@/lib/event-registration";

export async function EventDetailPage({ id, locale }: { id: string; locale: "en" | "cn" }) {
  const result = await execute(`SELECT e.*,
    (SELECT updated_at FROM landing_page_assets WHERE slot = 'event-' || e.id) AS poster_updated_at
    FROM events e WHERE e.id = ? AND e.status IN ('upcoming', 'completed')`, [id]);
  if (!result.rows[0]) notFound();
  const cn = locale === "cn";
  const event = cn ? chineseEvent(result.rows[0] as unknown as ClubEvent) : result.rows[0] as unknown as ClubEvent;
  const date = cn ? formatChineseEventDate : formatEventDate;
  const time = cn ? formatChineseEventTime : formatEventTime;
  const upcoming = event.status === "upcoming" && new Date(event.event_date).getTime() > Date.now();
  const registrationUrl = safeEventRegistrationUrl(event.registration_url);
  const fees = cn ? event.fee_details_cn || event.fee_details : event.fee_details || event.fee_details_cn;
  const payment = cn ? event.payment_instructions_cn || event.payment_instructions : event.payment_instructions || event.payment_instructions_cn;
  return <>
    <SiteHeader locale={locale} />
    <main className="event-detail">
      <Link href={cn ? "/cn/events" : "/events"}>{cn ? "← 返回活动日历" : "← Event calendar"}</Link>
      <p className="eyebrow">{event.category}</p><h1>{event.title}</h1>
      <div className="event-detail-grid">
        {event.poster_updated_at && <PosterLightbox locale={locale} src={landingImageUrl(`event-${event.id}`, event.poster_updated_at)} alt={event.title} />}
        <div>
          <div className="event-detail-meta">
            <strong>{date(event.event_date, true)}</strong>
            <span>{time(event.event_date)}{event.end_date ? ` – ${time(event.end_date)}` : ""} {cn ? "（美国东部时间）" : "(Eastern Time)"}</span>
            <strong>{event.location}</strong>
            {event.capacity > 0 && <span>{cn ? `计划人数：${event.capacity} 人` : `Planned capacity: ${event.capacity}`}</span>}
          </div>
          <div className="event-detail-description">{event.description}</div>
          {(fees || payment) && <section className="event-payment-details" aria-label={cn ? "活动费用与付款方式" : "Event fees and payment"}>
            {fees && <div><h2>{cn ? "活动费用" : "Event fees"}</h2><p>{fees}</p></div>}
            {payment && <div><h2>{cn ? "付款方式" : "Payment methods"}</h2><p>{payment}</p></div>}
          </section>}
          {upcoming ? <div className="event-registration-action">{registrationUrl
            ? <><a className="button button-dark" href={registrationUrl} target="_blank" rel="noopener noreferrer">{cn ? "报名登记" : "Register"}</a><p>{cn ? "请填写活动报名表，完成报名登记。" : "Complete the event registration form to sign up."}{payment && (cn ? "请按上方说明支付活动费用。" : " Follow the payment instructions above.")}</p></>
            : <Link className="button button-dark" href={cn ? "/cn/member" : "/member"}>{cn ? "报名登记" : "Register through the member portal"}</Link>}</div>
            : <p>{cn ? "活动已结束。" : "This event has ended."}</p>}
        </div>
      </div>
    </main>
    <SiteFooter locale={locale} />
  </>;
}
