import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, MapPin, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getEvents } from "@/lib/db";
import { formatEventDate, formatEventTime } from "@/lib/format";

export const metadata = { title: "Events" };

export default async function EventsPage() {
  const events = await getEvents();
  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-hero events-hero">
          <div><p className="eyebrow eyebrow-light">The CAUCC calendar</p><h1>Plans that make you<br /><em>feel good.</em></h1><p>Come as you are. Leave a little stronger, wiser, or more connected than you arrived.</p></div>
        </section>
        <section className="section event-list-section">
          <div className="section-heading split-heading compact-heading">
            <div><p className="eyebrow">Upcoming gatherings</p><h2>Save your spot.</h2></div>
            <p>Members can reserve from their personal portal. New here? Join the club in just a few minutes.</p>
          </div>
          <div className="event-list">
            {events.map((event, index) => (
              <article className="event-row" key={event.id}>
                <div className="event-date-block"><strong>{new Date(event.event_date).toLocaleDateString("en-US", { timeZone: "America/New_York", day: "2-digit" })}</strong><span>{new Date(event.event_date).toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short" })}</span></div>
                <div className={`event-list-art art-tone-${(index % 3) + 1}`}><span>{event.category}</span></div>
                <div className="event-row-copy">
                  <small>{event.category}</small><h3>{event.title}</h3><p>{event.description}</p>
                  <div className="event-inline-meta"><span><CalendarDays size={15} />{formatEventDate(event.event_date)}</span><span><Clock3 size={15} />{formatEventTime(event.event_date)}</span><span><MapPin size={15} />{event.location}</span><span><Users size={15} />{event.attendee_count || 0}/{event.capacity}</span></div>
                </div>
                <Link className="round-link" href={event.id === "forum-2026-09-07" ? "/events/ai-health-wealth-forum" : "/member"} aria-label={`Reserve ${event.title}`}><ArrowRight size={20} /></Link>
              </article>
            ))}
          </div>
          {events.length === 0 && <div className="empty-state"><CalendarDays size={30} /><h3>Fresh events are on the way.</h3><p>Turn on notifications from the home page and we’ll let you know first.</p></div>}
        </section>
        <section className="simple-cta"><div><p className="eyebrow eyebrow-light">Make yourself a regular</p><h2>Belonging starts with<br /><em>showing up.</em></h2></div><Link className="button button-coral" href="/join">Join CAUCC <ArrowRight size={17} /></Link></section>
      </main>
      <SiteFooter />
    </>
  );
}
