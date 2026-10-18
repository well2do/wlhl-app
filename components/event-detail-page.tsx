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
import { eventPageCopy, eventPosterCopy } from "@/lib/event-page-copy";
import { isUpcomingEvent } from "@/lib/event-time";

export async function EventDetailPage({ id, locale }: { id: string; locale: "en" | "cn" }) {
  const result = await execute(`SELECT e.*,
    (SELECT updated_at FROM landing_page_assets WHERE slot = 'event-' || e.id) AS poster_updated_at
    FROM events e WHERE e.id = ? AND e.status IN ('upcoming', 'completed')`, [id]);
  if (!result.rows[0]) notFound();
  const cn = locale === "cn";
  const event = cn ? chineseEvent(result.rows[0] as unknown as ClubEvent) : result.rows[0] as unknown as ClubEvent;
  const date = cn ? formatChineseEventDate : formatEventDate;
  const time = cn ? formatChineseEventTime : formatEventTime;
  const upcoming = isUpcomingEvent(event);
  const registrationUrl = safeEventRegistrationUrl(event.registration_url);
  const fees = cn ? event.fee_details_cn || event.fee_details : event.fee_details || event.fee_details_cn;
  const payment = cn ? event.payment_instructions_cn || event.payment_instructions : event.payment_instructions || event.payment_instructions_cn;
  const copy = eventPageCopy(cn ? event.page_copy_cn : event.page_copy, locale);
  const registrationNote = [copy.registrationNote, payment ? copy.paymentNote : ''].filter(Boolean).join(cn ? '' : ' ');
  return <>
    <SiteHeader locale={locale} />
    <main className="event-detail" lang={cn ? "zh-CN" : "en"}>
      <Link href={cn ? "/cn/events" : "/events"}>← {copy.backLink}</Link>
      <p className="eyebrow">{event.category}</p><h1>{event.title}</h1>
      <div className={`event-detail-grid${event.poster_updated_at ? '' : ' event-detail-no-poster'}`}>
        {event.poster_updated_at && <PosterLightbox locale={locale} src={landingImageUrl(`event-${event.id}`, event.poster_updated_at)} alt={event.title} copy={eventPosterCopy(copy, locale)} />}
        <div>
          <div className="event-detail-meta">
            <strong>{date(event.event_date, true)}</strong>
            {event.date_precision !== 'day' && <span>{time(event.event_date)}{event.end_date ? ` – ${time(event.end_date)}` : ""} {copy.timezone}</span>}
            <strong>{event.location}</strong>
            {event.capacity > 0 && <span>{copy.capacity.replaceAll('{capacity}', String(event.capacity))}</span>}
          </div>
          <div className="event-detail-description">{event.description}</div>
          {(fees || payment) && <section className="event-payment-details" aria-label={[fees ? copy.feesHeading : '', payment ? copy.paymentHeading : ''].filter(Boolean).join(' / ')}>
            {fees && <div><h2>{copy.feesHeading}</h2><p>{fees}</p></div>}
            {payment && <div><h2>{copy.paymentHeading}</h2><p>{payment}</p></div>}
          </section>}
          {upcoming ? <div className="event-registration-action">{registrationUrl
            ? <><a className="button button-dark" href={registrationUrl} target="_blank" rel="noopener noreferrer">{copy.registrationButton}</a>{registrationNote && <p>{registrationNote}</p>}</>
            : <Link className="button button-dark" href={cn ? "/cn/member" : "/member"}>{copy.memberRegistrationButton}</Link>}</div>
            : <p>{copy.endedMessage}</p>}
        </div>
      </div>
    </main>
    <SiteFooter locale={locale} />
  </>;
}
