import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  HeartHandshake,
  Leaf,
  MapPin,
  MoveUpRight,
  Quote,
  Salad,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { NotificationButton } from "@/components/notification-button";
import { getAnnouncements, getEvents, getProducts } from "@/lib/db";
import { formatCurrency, formatEventDate, formatEventTime } from "@/lib/format";

const benefits = [
  { icon: Users, title: "People who get you", copy: "Meet neighbors who believe that feeling better is easier—and more joyful—together." },
  { icon: Salad, title: "Practical wellness", copy: "Friendly guidance on movement, nutrition, sleep, and healthy aging you can use every day." },
  { icon: HeartHandshake, title: "A reason to show up", copy: "Events, workshops, walks, and celebrations that keep connection on your calendar." },
];

export default async function HomePage() {
  const [events, announcements, products] = await Promise.all([getEvents(), getAnnouncements(3), getProducts()]);
  const nextEvent = events[0];
  const zelleHandle = process.env.NEXT_PUBLIC_ZELLE_HANDLE;
  const zelleRecipient = process.env.NEXT_PUBLIC_ZELLE_RECIPIENT;
  const clubEmail = process.env.NEXT_PUBLIC_CLUB_EMAIL;

  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />
          <div className="hero-content">
            <div className="hero-copy">
              <p className="eyebrow eyebrow-light"><Sparkles size={14} /> Washington, D.C.’s healthy life community</p>
              <h1>More life in<br /><em>every year.</em></h1>
              <p className="hero-lede">A welcoming club for people who want to stay active, feel connected, and make healthy living something to look forward to.</p>
              <div className="hero-actions">
                <Link className="button button-coral" href="/join">Become a member <ArrowRight size={17} /></Link>
                <Link className="button button-ghost-light" href="/events">Explore events</Link>
              </div>
              <div className="hero-trust">
                <div className="avatar-stack" aria-hidden="true">
                  <span>JM</span><span>AL</span><span>RB</span><span>+42</span>
                </div>
                <p><strong>Growing stronger together</strong><br />in the Washington community</p>
              </div>
            </div>
            <div className="hero-visual" aria-label="A bright, growing wellness community">
              <div className="sun-disc"><span /></div>
              <div className="botanical botanical-left"><Leaf size={90} /></div>
              <div className="botanical botanical-right"><Leaf size={130} /></div>
              <div className="hero-card hero-card-top">
                <span className="mini-icon"><ShieldCheck size={18} /></span>
                <div><strong>Whole-person wellness</strong><small>Movement · food · connection</small></div>
              </div>
              <div className="hero-card hero-card-bottom">
                <span className="pulse-dot" />
                <div><strong>Next gathering</strong><small>{nextEvent ? formatEventDate(nextEvent.event_date) : "Coming soon"}</small></div>
              </div>
              <div className="hero-figure">
                <div className="figure-head" />
                <div className="figure-body" />
                <div className="figure-arm figure-arm-left" />
                <div className="figure-arm figure-arm-right" />
              </div>
              <span className="hero-caption">Wellness looks good on you.</span>
            </div>
          </div>
          <div className="hero-wave" />
        </section>

        <section className="announcement-strip" aria-label="Latest club news">
          <div className="announcement-label"><span className="live-dot" /> Club news</div>
          <div className="announcement-items">
            {announcements.slice(0, 2).map((item) => (
              <p key={item.id}><strong>{item.title}</strong><span>{item.message}</span></p>
            ))}
          </div>
        </section>

        <section className="section section-intro" id="about">
          <div className="section-heading centered-heading">
            <p className="eyebrow">Well-being with good company</p>
            <h2>This chapter can be your<br /><em>healthiest one yet.</em></h2>
            <p>WLHL brings together the people, practices, and encouragement that make a vibrant life feel possible.</p>
          </div>
          <div className="benefit-grid">
            {benefits.map(({ icon: Icon, title, copy }, index) => (
              <article className="benefit-card" key={title}>
                <span className={`benefit-icon benefit-${index + 1}`}><Icon size={24} /></span>
                <span className="card-number">0{index + 1}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        {nextEvent && (
          <section className="section event-feature-section">
            <div className="event-feature">
              <div className="event-art">
                <div className="event-art-ring" />
                <div className="event-art-leaf"><Leaf size={130} /></div>
                <div className="event-art-copy"><small>Move gently.</small><strong>Live fully.</strong></div>
              </div>
              <div className="event-feature-copy">
                <p className="eyebrow">Up next at WLHL</p>
                <h2>{nextEvent.title}</h2>
                <p>{nextEvent.description}</p>
                <div className="event-meta-grid">
                  <span><CalendarDays size={19} /><strong>{formatEventDate(nextEvent.event_date, true)}</strong></span>
                  <span><Clock3 size={19} /><strong>{formatEventTime(nextEvent.event_date)}</strong></span>
                  <span className="wide-meta"><MapPin size={19} /><strong>{nextEvent.location}</strong></span>
                </div>
                <Link className="button button-dark" href="/member">Reserve your spot <ArrowRight size={17} /></Link>
                <Link className="under-link" href="/events">See all upcoming events</Link>
              </div>
            </div>
          </section>
        )}

        <section className="section shop-section" id="shop">
          <div className="section-heading split-heading">
            <div><p className="eyebrow">The wellness shelf</p><h2>Small things that support<br /><em>better days.</em></h2></div>
            <p>Thoughtfully selected by our community for simple, sustainable healthy habits.</p>
          </div>
          <div className="product-grid">
            {products.slice(0, 3).map((product, index) => (
              <article className="product-card" key={product.id}>
                <div className={`product-art product-art-${index + 1}`}>
                  {index === 0 ? <Leaf size={70} /> : index === 1 ? <MoveUpRight size={66} /> : <Quote size={62} />}
                  {product.badge && <span className="product-badge">{product.badge}</span>}
                </div>
                <div className="product-copy">
                  <small>{product.category}</small>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div><strong>{formatCurrency(Number(product.price))}</strong><a href={clubEmail ? `mailto:${clubEmail}?subject=${encodeURIComponent(`WLHL order: ${product.name}`)}` : "/join"} aria-label={`Ask to buy ${product.name}`}><ShoppingBag size={17} /></a></div>
                </div>
              </article>
            ))}
          </div>
          <div className="payment-note">
            <ShieldCheck size={22} />
            <div>
              <strong>Simple direct payment with Zelle</strong>
              {zelleHandle && zelleRecipient ? (
                <span>Send to <b>{zelleRecipient}</b> at <b>{zelleHandle}</b>. Include your name and item in the memo. We’ll confirm every order directly.</span>
              ) : (
                <span>Contact a club coordinator before sending payment. Your confirmed Zelle recipient and order total will be provided directly.</span>
              )}
            </div>
          </div>
        </section>

        <section className="notification-section">
          <div className="notification-copy">
            <span className="eyebrow eyebrow-light">Never miss what’s next</span>
            <h2>Good things are<br /><em>worth showing up for.</em></h2>
            <p>Get a gentle heads-up when a new event, promotion, or club announcement is posted.</p>
            <NotificationButton publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY} />
          </div>
          <div className="phone-preview" aria-hidden="true">
            <div className="phone-speaker" />
            <div className="phone-time">9:41</div>
            <div className="phone-leaf"><Leaf size={88} /></div>
            <div className="phone-alert"><span className="brand-mark"><Leaf size={14} /></span><div><small>WLHL · now</small><strong>Wellness walk tomorrow</strong><p>We’ll meet at the Arboretum at 9 AM. See you there!</p></div></div>
          </div>
        </section>

        <section className="section membership-cta">
          <div className="membership-card">
            <div>
              <p className="eyebrow eyebrow-light">Your invitation is open</p>
              <h2>A healthier life.<br /><em>A fuller calendar.</em></h2>
              <p>Join a community that helps you keep both.</p>
            </div>
            <div className="membership-details">
              <p><Check size={17} /> Local events and workshops</p>
              <p><Check size={17} /> Member product offers</p>
              <p><Check size={17} /> Personalized event history</p>
              <p><Check size={17} /> Club news and reminders</p>
              <Link className="button button-coral button-full" href="/join">Start your membership <ArrowRight size={17} /></Link>
              <small>Applications are free. Membership fees are confirmed before payment.</small>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
