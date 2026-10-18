import Link from 'next/link';
import { ArrowRight, CalendarDays, Clock3, MapPin, Users } from 'lucide-react';
import type { ClubEvent } from '@/lib/types';
import { chineseEvent, formatChineseEventDate, formatChineseEventTime } from '@/lib/chinese';
import { formatEventDate, formatEventTime } from '@/lib/format';
import { eventHref } from '@/lib/event-time';
import { landingImageUrl } from '@/lib/landing-page-content';

export function EventList({ events, locale, linkLabel }: { events: ClubEvent[]; locale: 'en' | 'cn'; linkLabel: string }) {
  const cn = locale === 'cn';
  const date = cn ? formatChineseEventDate : formatEventDate;
  const time = cn ? formatChineseEventTime : formatEventTime;
  return <div className="event-list">{events.map((original, index) => {
    const event = cn ? chineseEvent(original) : original;
    const summary = event.description.replace(/\s+/g, ' ').trim();
    return <article className="event-row" key={event.id} data-event-date={event.event_date}>
      <div className="event-date-block"><strong>{new Date(event.event_date).toLocaleDateString(cn ? 'zh-CN' : 'en-US', { timeZone: 'America/New_York', day: '2-digit' })}</strong><span>{new Date(event.event_date).toLocaleDateString(cn ? 'zh-CN' : 'en-US', { timeZone: 'America/New_York', month: 'short' })}</span></div>
      <div className={`event-list-art art-tone-${(index % 3) + 1} ${event.poster_updated_at ? 'has-event-poster' : ''}`}>{event.poster_updated_at ? <Link href={eventHref(event.id, locale)}><img src={landingImageUrl(`event-${event.id}`, event.poster_updated_at)} alt={event.title} /></Link> : <span>{event.category}</span>}</div>
      <div className="event-row-copy"><small>{event.category}</small><h3><Link href={eventHref(event.id, locale)}>{event.title}</Link></h3><p>{summary.length > 180 ? summary.slice(0, 180) + '…' : summary}</p>
        <div className="event-inline-meta">
          <span><CalendarDays size={15} /><time dateTime={event.date_precision === 'day' ? event.event_date.slice(0, 10) : event.event_date}>{date(event.event_date, true)}</time></span>
          {event.date_precision !== 'day' && <span><Clock3 size={15} />{time(event.event_date)}{event.end_date && ` – ${time(event.end_date)}`}</span>}
          <span><MapPin size={15} />{event.location}</span>
          {event.capacity > 0 && <span><Users size={15} />{event.attendee_count || 0}/{event.capacity}</span>}
        </div>
      </div>
      <Link className="round-link" href={eventHref(event.id, locale)} aria-label={`${linkLabel}: ${event.title}`}><ArrowRight size={20} /></Link>
    </article>;
  })}</div>;
}
