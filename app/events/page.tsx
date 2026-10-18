import { createCopy } from "@/lib/page-copy";
import { getPageCopy } from "@/lib/page-copy-store";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getEvents, getPastEvents } from "@/lib/db";
import { EventList } from "@/components/event-list";

export const metadata = { title: "Events" };

export default async function EventsPage() {
  const copyText = createCopy(await getPageCopy("events", "en"));
  const [events, pastEvents] = await Promise.all([getEvents(), getPastEvents()]);
  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-hero events-hero">
          <div><p className="eyebrow eyebrow-light">{copyText("The club calendar")}</p><h1>{copyText("Plans that make you")}<br /><em>{copyText("feel good.")}</em></h1><p>{copyText("Come as you are. Leave a little stronger, wiser, or more connected than you arrived.")}</p></div>
        </section>
        <section className="section event-list-section">
          <div className="section-heading split-heading compact-heading">
            <div><p className="eyebrow">{copyText("Upcoming gatherings")}</p><h2>{copyText("Event registration")}</h2></div>
            <p>{copyText("Open an event to view fees, payment methods and registration details.")}</p>
          </div>
          <EventList events={events} locale="en" linkLabel={copyText("Register")} />
          {events.length === 0 && <div className="empty-state"><CalendarDays size={30} /><h3>{copyText("Fresh events are on the way.")}</h3><p>{copyText("Turn on notifications from the home page and we’ll let you know first.")}</p></div>}
        </section>
        {pastEvents.length > 0 && <section className="section event-list-section" id="past-events" aria-labelledby="past-events-heading">
          <div className="section-heading split-heading compact-heading"><div><p className="eyebrow">{copyText("Meeting minutes and recaps")}</p><h2 id="past-events-heading">{copyText("Past events")}</h2></div><p>{copyText("Browse past gatherings by date, newest first. Open an event for the full record.")}</p></div>
          <EventList events={pastEvents} locale="en" linkLabel={copyText("View event record")} />
        </section>}
        <section className="simple-cta"><div><p className="eyebrow eyebrow-light">{copyText("Make yourself a regular")}</p><h2>{copyText("Belonging starts with")}<br /><em>{copyText("showing up.")}</em></h2></div><Link className="button button-coral" href="/join">{copyText("Join the club ")}<ArrowRight size={17} /></Link></section>
      </main>
      <SiteFooter />
    </>
  );
}
