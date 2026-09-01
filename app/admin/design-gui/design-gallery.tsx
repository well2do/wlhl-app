"use client";

import Link from "next/link";
import { type KeyboardEvent, useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Dumbbell,
  Heart,
  Leaf,
  MapPin,
  Menu,
  MessageCircleHeart,
  MoveRight,
  Salad,
  ShoppingBag,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import styles from "./design-gui.module.css";

export type DesignGalleryContent = {
  event: {
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    availability: string;
  };
  announcement: { title: string; message: string };
  products: Array<{ name: string; category: string; price: string }>;
};

type ConceptProps = { content: DesignGalleryContent };

const concepts = [
  {
    number: "01",
    name: "Flourish",
    mood: "Botanical editorial",
    summary: "Warm, human, and established",
    bestFor: "A welcoming all-ages community with a premium but approachable feel.",
    signature: "Asymmetrical editorial hero, botanical forms, and story-led sections.",
    colors: ["#173F35", "#F3EBDD", "#F2795F", "#EAB65A"],
  },
  {
    number: "02",
    name: "Pulse",
    mood: "Performance bento",
    summary: "Confident, active, and modern",
    bestFor: "Positioning WLHL as a measurable, energetic longevity program.",
    signature: "Dark bento dashboard, bold metrics, and neon action cues.",
    colors: ["#0D1010", "#C7F36B", "#8A74FF", "#F4F6F1"],
  },
  {
    number: "03",
    name: "Neighbor",
    mood: "Community collage",
    summary: "Joyful, social, and local",
    bestFor: "Making friendship and belonging the strongest reason to join.",
    signature: "Playful sticker shapes, overlapping cards, and event-first storytelling.",
    colors: ["#F8EEDB", "#E75336", "#183B63", "#F4C84E"],
  },
  {
    number: "04",
    name: "Still",
    mood: "Quiet longevity",
    summary: "Calm, refined, and spacious",
    bestFor: "A mature audience that values trust, clarity, and understated quality.",
    signature: "Editorial whitespace, restrained typography, and a vertical journey.",
    colors: ["#F2EFE7", "#2E352C", "#A2A77A", "#8B5E4B"],
  },
  {
    number: "05",
    name: "The Dispatch",
    mood: "Community newspaper",
    summary: "Informative, credible, and alive",
    bestFor: "A club with frequent programs, announcements, and useful resources.",
    signature: "Masthead navigation, news columns, hard rules, and bulletin blocks.",
    colors: ["#F5F2E9", "#111111", "#1D4ED8", "#F2C94C"],
  },
  {
    number: "06",
    name: "Horizon",
    mood: "Optimistic future",
    summary: "Bright, expressive, and ambitious",
    bestFor: "Making longevity feel progressive, upbeat, and culturally current.",
    signature: "Immersive gradients, floating orbits, and a flowing program rail.",
    colors: ["#38257C", "#8EE8F2", "#FF875E", "#F7F4FF"],
  },
] as const;

const conceptComponents = [FlourishConcept, PulseConcept, NeighborConcept, StillConcept, DispatchConcept, HorizonConcept];

export function DesignGallery({ content }: { content: DesignGalleryContent }) {
  const [activeConcept, setActiveConcept] = useState(0);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const concept = concepts[activeConcept];
  const ActiveConcept = conceptComponents[activeConcept];

  useEffect(() => {
    const requestedDesign = Number(new URLSearchParams(window.location.search).get("design"));
    if (requestedDesign >= 1 && requestedDesign <= concepts.length) setActiveConcept(requestedDesign - 1);
  }, []);

  function selectConcept(index: number, moveFocus = false) {
    setActiveConcept(index);
    const url = new URL(window.location.href);
    url.searchParams.set("design", String(index + 1));
    window.history.replaceState(null, "", url);
    if (moveFocus) requestAnimationFrame(() => document.getElementById(`concept-tab-${index + 1}`)?.focus());
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const offset = event.key === "ArrowRight" ? 1 : -1;
    selectConcept((activeConcept + offset + concepts.length) % concepts.length, true);
  }

  return (
    <main className={styles.studio}>
      <header className={styles.studioHeader}>
        <div className={styles.studioHeading}>
          <Link href="/admin" className={styles.backLink}><ArrowLeft size={16} /> Dashboard</Link>
          <div>
            <p>WLHL creative room <span>6 directions</span></p>
            <h1>Homepage design studio</h1>
          </div>
        </div>
        <p className={styles.studioNote}>Choose a direction to refine into the new live homepage.</p>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.conceptRail} aria-label="Homepage concepts">
          <div className={styles.railHeading}>
            <span>Design directions</span>
            <small>{String(activeConcept + 1).padStart(2, "0")} / 06</small>
          </div>
          <div className={styles.conceptList} role="tablist" aria-label="Select a homepage design" onKeyDown={handleTabKeyDown}>
            {concepts.map((item, index) => (
              <button
                type="button"
                role="tab"
                id={`concept-tab-${index + 1}`}
                aria-selected={activeConcept === index}
                aria-controls="homepage-preview"
                tabIndex={activeConcept === index ? 0 : -1}
                className={activeConcept === index ? styles.conceptButtonActive : styles.conceptButton}
                key={item.name}
                onClick={() => selectConcept(index)}
              >
                <span className={styles.conceptNumber}>{item.number}</span>
                <span className={styles.conceptText}><strong>{item.name}</strong><small>{item.mood}</small></span>
                <span className={styles.miniPalette} aria-hidden="true">
                  {item.colors.slice(0, 3).map((color) => <i style={{ backgroundColor: color }} key={color} />)}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className={styles.canvas}>
          <div className={styles.previewToolbar}>
            <div className={styles.previewTitle}>
              <span className={styles.liveDot} />
              <p><strong>{concept.number} — {concept.name}</strong><small>{concept.summary}</small></p>
            </div>
            <div className={styles.viewportToggle} aria-label="Preview width">
              <button type="button" className={viewport === "desktop" ? styles.viewportActive : ""} onClick={() => setViewport("desktop")}>Desktop</button>
              <button type="button" className={viewport === "mobile" ? styles.viewportActive : ""} onClick={() => setViewport("mobile")}>Mobile</button>
            </div>
          </div>

          <div className={`${styles.previewViewport} ${viewport === "mobile" ? styles.previewMobile : ""}`}>
            <div className={styles.browserFrame}>
              <div className={styles.browserChrome} aria-hidden="true">
                <span /><span /><span />
                <p>wlhl.org</p>
              </div>
              <div className={styles.prototype} id="homepage-preview" role="tabpanel" aria-labelledby={`concept-tab-${activeConcept + 1}`}>
                <ActiveConcept content={content} />
              </div>
            </div>
          </div>

          <footer className={styles.conceptDetails}>
            <div><small>Best fit</small><p>{concept.bestFor}</p></div>
            <div><small>Signature move</small><p>{concept.signature}</p></div>
            <div className={styles.paletteDetail}>
              <small>Palette</small>
              <span>{concept.colors.map((color) => <i style={{ backgroundColor: color }} key={color} title={color} />)}</span>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}

function ConceptBrand({ compact = false }: { compact?: boolean }) {
  return <span className={`${styles.conceptBrand} ${compact ? styles.conceptBrandCompact : ""}`}><i><Leaf size={17} /></i><b>WLHL</b>{!compact && <small>Washington Longevity<br />Healthy Life Club</small>}</span>;
}

function FlourishConcept({ content }: ConceptProps) {
  return (
    <article className={`${styles.conceptPage} ${styles.flourish}`}>
      <header className={styles.flourishNav}>
        <ConceptBrand />
        <nav><span>Our story</span><span>Gatherings</span><span>Wellness shop</span></nav>
        <div><span>EN / 中</span><Link href="/join">Join the club <ArrowUpRight size={14} /></Link></div>
      </header>

      <section className={styles.flourishHero}>
        <div className={styles.flourishCopy}>
          <p><Sparkles size={14} /> Healthy years, shared</p>
          <h2>Longer life.<br /><em>Richer days.</em></h2>
          <p className={styles.flourishLede}>A Washington community making movement, friendship, and everyday wellness feel naturally part of life.</p>
          <div className={styles.flourishActions}><Link href="/join">Find your place <ArrowRight size={16} /></Link><Link href="/events">See what’s on</Link></div>
          <div className={styles.flourishProof}><span><b>42+</b><small>neighbors growing together</small></span><span><b>12</b><small>gatherings this season</small></span></div>
        </div>
        <div className={styles.flourishArt} aria-hidden="true">
          <span className={styles.flourishSun} />
          <span className={styles.flourishStem}><i /><i /><i /><i /></span>
          <span className={styles.flourishPerson}><i /></span>
          <p><Heart size={15} fill="currentColor" /><b>Wellness is social</b><small>Built for real life</small></p>
        </div>
      </section>

      <section className={styles.flourishEvent}>
        <div><span>Next gathering</span><b>01</b></div>
        <div><small>{content.event.date} · {content.event.time}</small><h3>{content.event.title}</h3><p>{content.event.location}</p></div>
        <p>{content.event.description}</p>
        <Link href="/events">Reserve a place <ArrowUpRight size={16} /></Link>
      </section>

      <section className={styles.flourishPillars}>
        <div><p>Life gets better<br />when we practice it<br /><em>together.</em></p></div>
        <article><span><Users size={21} /></span><b>Good company</b><p>Neighbors who make showing up the easy part.</p></article>
        <article><span><Activity size={21} /></span><b>Everyday strength</b><p>Practical habits for energy, balance, and joy.</p></article>
        <article><span><Sun size={21} /></span><b>More to look forward to</b><p>Fresh experiences, shared throughout the year.</p></article>
      </section>
    </article>
  );
}

function PulseConcept({ content }: ConceptProps) {
  return (
    <article className={`${styles.conceptPage} ${styles.pulse}`}>
      <header className={styles.pulseNav}>
        <ConceptBrand compact />
        <nav><span>PROGRAMS</span><span>EVENTS</span><span>MEMBERSHIP</span></nav>
        <Link href="/join">START NOW <ArrowUpRight size={14} /></Link>
      </header>

      <section className={styles.pulseHero}>
        <div className={styles.pulseCopy}>
          <p><i /> WASHINGTON’S LONGEVITY CLUB</p>
          <h2>Build a life<br />with more <em>go.</em></h2>
          <div><p>Movement. Nutrition. Real connection. A community designed to keep your good years in motion.</p><Link href="/join">JOIN THE MOVEMENT <ArrowRight size={17} /></Link></div>
        </div>
        <div className={styles.pulseScore}>
          <span>COMMUNITY<br />VITALITY</span>
          <b>86</b><sup>/100</sup>
          <p><ArrowUpRight size={14} /> +12% this season</p>
          <i className={styles.pulseRing} />
        </div>
      </section>

      <section className={styles.pulseBento}>
        <article className={styles.pulseEvent}>
          <div><span>UP NEXT</span><span>{content.event.availability}</span></div>
          <h3>{content.event.title}</h3>
          <p><CalendarDays size={14} /> {content.event.date}</p><p><MapPin size={14} /> {content.event.location}</p>
          <Link href="/events">BOOK A SPOT <ArrowUpRight size={16} /></Link>
        </article>
        <article className={styles.pulseMetric}><Activity size={27} /><span><b>3×</b><small>weekly ways<br />to move</small></span><i /></article>
        <article className={styles.pulsePeople}><div><span>MJ</span><span>AL</span><span>RB</span></div><b>42 people<br />already in</b><p>Come as you are.</p></article>
        <article className={styles.pulseQuote}><MessageCircleHeart size={22} /><p>“I came for Tai Chi.<br />I stayed for the people.”</p><small>— MARIA, MEMBER SINCE ’25</small></article>
      </section>

      <div className={styles.pulseTicker}><span>MOVE WELL</span><i /> <span>EAT BRIGHT</span><i /> <span>STAY CURIOUS</span><i /> <span>LIVE CONNECTED</span></div>
    </article>
  );
}

function NeighborConcept({ content }: ConceptProps) {
  return (
    <article className={`${styles.conceptPage} ${styles.neighbor}`}>
      <header className={styles.neighborNav}>
        <ConceptBrand compact />
        <p>YOUR HEALTHY-LIFE SOCIAL CLUB</p>
        <button type="button" aria-label="Preview menu"><Menu size={20} /></button>
      </header>

      <section className={styles.neighborHero}>
        <span className={styles.neighborDoodle}>good days<br /><b>ahead!</b><ArrowRight size={18} /></span>
        <p className={styles.neighborKicker}>MOVEMENT · FRIENDSHIP · A LITTLE MORE FUN</p>
        <h2>Wellness has<br /><em>better plans</em><br />for us.</h2>
        <p className={styles.neighborLede}>Meet the D.C. neighbors turning healthy living into the best part of the week.</p>
        <Link href="/join">Save me a seat <Heart size={16} fill="currentColor" /></Link>
        <div className={styles.neighborFaces} aria-hidden="true"><span>J</span><span>M</span><span>A</span><span>+39</span></div>
      </section>

      <section className={styles.neighborCollage}>
        <article className={styles.neighborEventCard}>
          <span>THIS WEEK</span><h3>{content.event.title}</h3>
          <div><p><CalendarDays size={15} /> {content.event.date}</p><p><Clock3 size={15} /> {content.event.time}</p></div>
          <Link href="/events">I’m interested <ArrowUpRight size={15} /></Link>
        </article>
        <article className={styles.neighborSunCard}><Sun size={46} /><p><b>Outdoor energy</b><br />Walks, gardens & good conversation.</p></article>
        <article className={styles.neighborNoteCard}><span>CLUB NOTE</span><h3>{content.announcement.title}</h3><p>{content.announcement.message}</p></article>
      </section>

      <section className={styles.neighborReasons}>
        <p>Why people keep<br /><em>coming back</em></p>
        <div><article><b>01</b><span>Move without pressure</span></article><article><b>02</b><span>Learn something useful</span></article><article><b>03</b><span>Know more neighbors</span></article></div>
      </section>
    </article>
  );
}

function StillConcept({ content }: ConceptProps) {
  return (
    <article className={`${styles.conceptPage} ${styles.still}`}>
      <aside className={styles.stillRail}>
        <ConceptBrand compact />
        <span>EST. WASHINGTON, D.C.</span>
        <nav><b>01</b><i /><b>04</b></nav>
      </aside>
      <div className={styles.stillMain}>
        <header className={styles.stillNav}><nav><span>Philosophy</span><span>Calendar</span><span>Journal</span></nav><div><span>EN / 中文</span><Link href="/join">Membership</Link></div></header>

        <section className={styles.stillHero}>
          <div className={styles.stillCopy}>
            <p>WASHINGTON LONGEVITY HEALTHY LIFE CLUB</p>
            <h2>Live well,<br /><em>together.</em></h2>
            <p>Good health is not a finish line. It is a rhythm—made gentler, richer, and more lasting in good company.</p>
            <Link href="/join">Begin here <MoveRight size={19} /></Link>
          </div>
          <div className={styles.stillArt} aria-hidden="true"><span /><i /><p>Practice<br />the good life.</p></div>
        </section>

        <section className={styles.stillManifesto}>
          <span>OUR APPROACH</span>
          <p>We gather around the simple things that help a life <em>flourish:</em> movement, nourishment, curiosity, and friendship.</p>
        </section>

        <section className={styles.stillEvent}>
          <div><small>NEXT EXPERIENCE</small><h3>{content.event.title}</h3><p>{content.event.description}</p><Link href="/events">View the gathering <ArrowRight size={17} /></Link></div>
          <dl><div><dt>When</dt><dd>{content.event.date}<br />{content.event.time}</dd></div><div><dt>Where</dt><dd>{content.event.location}</dd></div><div><dt>Places</dt><dd>{content.event.availability}</dd></div></dl>
        </section>
      </div>
    </article>
  );
}

function DispatchConcept({ content }: ConceptProps) {
  return (
    <article className={`${styles.conceptPage} ${styles.dispatch}`}>
      <div className={styles.dispatchUtility}><span>WASHINGTON, D.C. · VOL. 01</span><span>HEALTHY LIVING FOR THE WHOLE COMMUNITY</span><span>EN / 中文</span></div>
      <header className={styles.dispatchMasthead}><div><Leaf size={31} /><span>WLHL</span></div><h2>The Healthy Life<br /><b>Dispatch</b></h2><Link href="/join">BECOME A MEMBER</Link></header>
      <nav className={styles.dispatchNav}><span>TODAY</span><span>EVENTS</span><span>MOVE</span><span>EAT WELL</span><span>COMMUNITY</span><span>SHOP</span></nav>

      <section className={styles.dispatchLead}>
        <article>
          <p>THE BIG IDEA / ISSUE 06</p>
          <h3>The good life<br />is <em>local news.</em></h3>
          <p>Across Washington, neighbors are choosing more movement, better food, and stronger connection—one gathering at a time.</p>
          <Link href="/join">READ OUR STORY <ArrowRight size={16} /></Link>
        </article>
        <div className={styles.dispatchIllustration} aria-hidden="true"><Sun size={85} /><span>42</span><p>NEIGHBORS<br />& COUNTING</p></div>
        <aside>
          <p>NEXT ON THE CALENDAR</p><b>{content.event.date}</b><h4>{content.event.title}</h4><span>{content.event.time}<br />{content.event.location}</span><Link href="/events">DETAILS <ArrowUpRight size={14} /></Link>
        </aside>
      </section>

      <section className={styles.dispatchGrid}>
        <div className={styles.dispatchBrief}><span>COMMUNITY BRIEF</span><h3>{content.announcement.title}</h3><p>{content.announcement.message}</p></div>
        <div className={styles.dispatchAgenda}><span>THE WEEK IN WELLNESS</span><ol><li><b>MON</b> Morning mobility <i>09:00</i></li><li><b>WED</b> Colorful cooking <i>18:30</i></li><li><b>SAT</b> Garden walk <i>10:00</i></li></ol></div>
        <div className={styles.dispatchShop}><span>FIELD TESTED</span><h3>{content.products[0]?.name}</h3><p>{content.products[0]?.category} · {content.products[0]?.price}</p><ShoppingBag size={26} /></div>
      </section>
    </article>
  );
}

function HorizonConcept({ content }: ConceptProps) {
  return (
    <article className={`${styles.conceptPage} ${styles.horizon}`}>
      <header className={styles.horizonNav}>
        <ConceptBrand compact />
        <nav><span>Discover</span><span>Gather</span><span>Thrive</span></nav>
        <div><span>EN · 中</span><Link href="/join">Join WLHL <ArrowUpRight size={14} /></Link></div>
      </header>

      <section className={styles.horizonHero}>
        <div className={styles.horizonCopy}>
          <p><Sparkles size={14} /> YOUR NEXT CHAPTER HAS RANGE</p>
          <h2>More energy.<br />More people.<br /><em>More life.</em></h2>
          <p>Modern longevity, made human. Explore experiences that help you move, connect, and keep becoming.</p>
          <div><Link href="/join">Explore membership <ArrowRight size={17} /></Link><Link href="/events"><span><CalendarDays size={16} /></span>See the calendar</Link></div>
        </div>
        <div className={styles.horizonOrbit} aria-hidden="true">
          <span className={styles.horizonOrbOne}><Activity size={30} /></span>
          <span className={styles.horizonOrbTwo}><Salad size={25} /></span>
          <span className={styles.horizonOrbThree}><Users size={25} /></span>
          <i /><i /><i />
          <p><b>42+</b><span>friends in<br />your orbit</span></p>
        </div>
      </section>

      <section className={styles.horizonPrograms}>
        <div><span>COMING INTO VIEW</span><p>Programs for every kind of good day.</p></div>
        <div className={styles.horizonCards}>
          <article><span>01 / MOVE</span><Dumbbell size={27} /><h3>Strength that travels with you.</h3><p>Mobility, balance, and everyday confidence.</p></article>
          <article><span>02 / NOURISH</span><Salad size={27} /><h3>Food that gives something back.</h3><p>Bright ideas for delicious, lasting habits.</p></article>
          <article><span>03 / BELONG</span><MessageCircleHeart size={27} /><h3>Plans worth putting on the calendar.</h3><p>Gatherings where new faces feel familiar.</p></article>
        </div>
      </section>

      <section className={styles.horizonEvent}>
        <div><span>NEXT UP</span><p>{content.event.date} · {content.event.time}</p></div>
        <h3>{content.event.title}</h3>
        <p>{content.event.location}</p>
        <Link href="/events"><ChevronRight size={19} /></Link>
      </section>
    </article>
  );
}
