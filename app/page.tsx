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
import { getAnnouncements, getEvents, getLandingPageAssetMetadata, getLandingPageContent, getProducts } from "@/lib/db";
import { formatCurrency, formatEventDate, formatEventTime } from "@/lib/format";
import { fillLandingTemplate, landingImageUrl } from "@/lib/landing-page-content";

export default async function HomePage() {
  const [events, announcements, products, content, assets] = await Promise.all([
    getEvents(),
    getAnnouncements(3),
    getProducts(),
    getLandingPageContent(),
    getLandingPageAssetMetadata(),
  ]);
  const nextEvent = events[0];
  const assetMap = new Map(assets.map((asset) => [asset.slot, asset]));
  const imageFor = (slot: string) => {
    const asset = assetMap.get(slot);
    return asset ? landingImageUrl(slot, asset.updated_at) : undefined;
  };
  const logoImage = imageFor("logo");
  const heroImage = imageFor("hero");
  const eventImage = nextEvent ? imageFor(`event-${nextEvent.id}`) : undefined;
  const notificationImage = imageFor("notification");
  const membershipImage = imageFor("membership");
  const zelleHandle = process.env.NEXT_PUBLIC_ZELLE_HANDLE;
  const zelleRecipient = process.env.NEXT_PUBLIC_ZELLE_RECIPIENT;
  const clubEmail = process.env.NEXT_PUBLIC_CLUB_EMAIL;
  const benefits = [
    { icon: Users, title: content.benefitOneTitle, copy: content.benefitOneDescription },
    { icon: Salad, title: content.benefitTwoTitle, copy: content.benefitTwoDescription },
    { icon: HeartHandshake, title: content.benefitThreeTitle, copy: content.benefitThreeDescription },
  ];

  return (
    <>
      <SiteHeader content={content} logoSrc={logoImage} />
      <main>
        <section className="hero">
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />
          <div className="hero-content">
            <div className="hero-copy">
              <p className="eyebrow eyebrow-light"><Sparkles size={14} /> {content.heroEyebrow}</p>
              <h1>{content.heroTitleLine}<br /><em>{content.heroTitleAccent}</em></h1>
              <p className="hero-lede">{content.heroDescription}</p>
              <div className="hero-actions">
                <Link className="button button-coral" href="/join">{content.heroPrimaryButton} <ArrowRight size={17} /></Link>
                <Link className="button button-ghost-light" href="/events">{content.heroSecondaryButton}</Link>
              </div>
              <div className="hero-trust">
                <div className="avatar-stack" aria-hidden="true">
                  <span>{content.heroAvatarOne}</span><span>{content.heroAvatarTwo}</span><span>{content.heroAvatarThree}</span><span>{content.heroAvatarFour}</span>
                </div>
                <p><strong>{content.heroTrustTitle}</strong><br />{content.heroTrustText}</p>
              </div>
            </div>
            <div className={`hero-visual ${heroImage ? "has-upload" : ""}`} aria-label={heroImage ? undefined : content.heroImageAlt}>
              {heroImage ? <img className="landing-cover-image" src={heroImage} alt={content.heroImageAlt} /> : (
                <>
                  <div className="sun-disc"><span /></div>
                  <div className="botanical botanical-left"><Leaf size={90} /></div>
                  <div className="botanical botanical-right"><Leaf size={130} /></div>
                  <div className="hero-figure">
                    <div className="figure-head" />
                    <div className="figure-body" />
                    <div className="figure-arm figure-arm-left" />
                    <div className="figure-arm figure-arm-right" />
                  </div>
                </>
              )}
              <div className="hero-card hero-card-top">
                <span className="mini-icon"><ShieldCheck size={18} /></span>
                <div><strong>{content.heroTopCardTitle}</strong><small>{content.heroTopCardText}</small></div>
              </div>
              <div className="hero-card hero-card-bottom">
                <span className="pulse-dot" />
                <div><strong>{content.heroNextEventLabel}</strong><small>{nextEvent ? formatEventDate(nextEvent.event_date) : content.heroNextEventFallback}</small></div>
              </div>
              <span className="hero-caption">{content.heroCaption}</span>
            </div>
          </div>
          <div className="hero-wave" />
        </section>

        <section className="announcement-strip" aria-label={content.announcementLabel}>
          <div className="announcement-label"><span className="live-dot" /> {content.announcementLabel}</div>
          <div className="announcement-items">
            {announcements.slice(0, 2).map((item) => (
              <p key={item.id}><strong>{item.title}</strong><span>{item.message}</span></p>
            ))}
          </div>
        </section>

        <section className="section section-intro" id="about">
          <div className="section-heading centered-heading">
            <p className="eyebrow">{content.introEyebrow}</p>
            <h2>{content.introTitleLine}<br /><em>{content.introTitleAccent}</em></h2>
            <p>{content.introDescription}</p>
            <Link className="about-intro-link" href="/about">{content.introAboutButton}<ArrowRight size={15} /></Link>
          </div>
          <div className="benefit-grid">
            {benefits.map(({ icon: Icon, title, copy }, index) => (
              <article className="benefit-card" key={`${index}-${title}`}>
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
              <div className={`event-art ${eventImage ? "has-upload" : ""}`}>
                {eventImage ? <img className="landing-cover-image" src={eventImage} alt={content.eventImageAlt} /> : (
                  <><div className="event-art-ring" /><div className="event-art-leaf"><Leaf size={130} /></div></>
                )}
                <div className="event-art-copy"><small>{content.eventArtworkSmallText}</small><strong>{content.eventArtworkLargeText}</strong></div>
              </div>
              <div className="event-feature-copy">
                <p className="eyebrow">{content.eventEyebrow}</p>
                <h2>{nextEvent.title}</h2>
                <p>{nextEvent.description}</p>
                <div className="event-meta-grid">
                  <span><CalendarDays size={19} /><strong>{formatEventDate(nextEvent.event_date, true)}</strong></span>
                  <span><Clock3 size={19} /><strong>{formatEventTime(nextEvent.event_date)}</strong></span>
                  <span className="wide-meta"><MapPin size={19} /><strong>{nextEvent.location}</strong></span>
                </div>
                <Link className="button button-dark" href="/member">{content.eventPrimaryButton} <ArrowRight size={17} /></Link>
                <Link className="under-link" href="/events">{content.eventSecondaryButton}</Link>
              </div>
            </div>
          </section>
        )}

        <section className="section shop-section" id="shop">
          <div className="section-heading split-heading">
            <div><p className="eyebrow">{content.shopEyebrow}</p><h2>{content.shopTitleLine}<br /><em>{content.shopTitleAccent}</em></h2></div>
            <p>{content.shopDescription}</p>
          </div>
          <div className="product-grid">
            {products.slice(0, 3).map((product, index) => {
              const productImage = imageFor(`product-${product.id}`);
              return (
                <article className="product-card" key={product.id}>
                  <div className={`product-art product-art-${index + 1} ${productImage ? "has-upload" : ""}`}>
                    {productImage
                      ? <img className="landing-cover-image" src={productImage} alt={product.name} />
                      : index === 0 ? <Leaf size={70} /> : index === 1 ? <MoveUpRight size={66} /> : <Quote size={62} />}
                    {product.badge && <span className="product-badge">{product.badge}</span>}
                  </div>
                  <div className="product-copy">
                    <small>{product.category}</small>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <div><strong>{formatCurrency(Number(product.price))}</strong><a href={clubEmail ? `mailto:${clubEmail}?subject=${encodeURIComponent(`CAUCC order: ${product.name}`)}` : "/join"} aria-label={`Ask to buy ${product.name}`}><ShoppingBag size={17} /></a></div>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="payment-note">
            <ShieldCheck size={22} />
            <div>
              <strong>{content.paymentTitle}</strong>
              <span>{zelleHandle && zelleRecipient
                ? fillLandingTemplate(content.paymentConfiguredText, { recipient: zelleRecipient, handle: zelleHandle })
                : content.paymentFallbackText}</span>
            </div>
          </div>
        </section>

        <section className="notification-section">
          <div className="notification-copy">
            <span className="eyebrow eyebrow-light">{content.notificationEyebrow}</span>
            <h2>{content.notificationTitleLine}<br /><em>{content.notificationTitleAccent}</em></h2>
            <p>{content.notificationDescription}</p>
            <NotificationButton
              publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}
              labels={{ idle: content.notificationButtonIdle, loading: content.notificationButtonLoading, enabled: content.notificationButtonEnabled, error: content.notificationError }}
            />
          </div>
          {notificationImage ? (
            <div className="notification-upload"><img src={notificationImage} alt={content.notificationImageAlt} /></div>
          ) : (
            <div className="phone-preview" aria-hidden="true">
              <div className="phone-speaker" />
              <div className="phone-time">{content.notificationPreviewTime}</div>
              <div className="phone-leaf"><Leaf size={88} /></div>
              <div className="phone-alert"><span className="brand-mark"><Leaf size={14} /></span><div><small>{content.notificationPreviewApp}</small><strong>{content.notificationPreviewTitle}</strong><p>{content.notificationPreviewMessage}</p></div></div>
            </div>
          )}
        </section>

        <section className="section membership-cta">
          <div className={`membership-card ${membershipImage ? "has-upload" : ""}`}>
            {membershipImage && <img className="membership-background-image" src={membershipImage} alt={content.membershipImageAlt} />}
            <div>
              <p className="eyebrow eyebrow-light">{content.membershipEyebrow}</p>
              <h2>{content.membershipTitleLine}<br /><em>{content.membershipTitleAccent}</em></h2>
              <p>{content.membershipDescription}</p>
            </div>
            <div className="membership-details">
              <p><Check size={17} /> {content.membershipBenefitOne}</p>
              <p><Check size={17} /> {content.membershipBenefitTwo}</p>
              <p><Check size={17} /> {content.membershipBenefitThree}</p>
              <p><Check size={17} /> {content.membershipBenefitFour}</p>
              <Link className="button button-coral button-full" href="/join">{content.membershipButton} <ArrowRight size={17} /></Link>
              <small>{content.membershipNote}</small>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter content={content} logoSrc={logoImage} />
    </>
  );
}
