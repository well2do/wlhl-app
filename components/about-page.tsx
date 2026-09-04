import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Building2,
  Check,
  ExternalLink,
  HeartHandshake,
  Leaf,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";
import { aboutContent, clubRegistrationUrl, type AboutLocale } from "@/lib/about-content";
import { getExpertProfiles } from "@/lib/db";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export async function AboutPage({ locale }: { locale: AboutLocale }) {
  const content = aboutContent[locale];
  const experts = await getExpertProfiles();
  const cn = locale === "cn";
  const prefix = cn ? "/cn" : "";

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="about-page" lang={cn ? "zh-CN" : "en"}>
        <section className="about-hero">
          <div className="about-hero-orbit" />
          <div className="about-hero-content">
            <div>
              <p className="eyebrow eyebrow-light"><Sparkles size={14} />{content.eyebrow}</p>
              <h1>{content.title}<br /><em>{content.titleAccent}</em></h1>
              <p>{content.introduction}</p>
              <div className="about-hero-actions">
                <Link className="button button-coral" href={`${prefix}/join`}>{content.joinButton}<ArrowRight size={17} /></Link>
                <a className="button button-ghost-light" href={clubRegistrationUrl} target="_blank" rel="noreferrer">{content.registrationButton}<ExternalLink size={15} /></a>
              </div>
            </div>
            <div className="about-hero-art" aria-hidden="true">
              <span className="about-sun"><Sparkles size={27} /></span>
              <Leaf className="about-leaf-one" size={145} />
              <Leaf className="about-leaf-two" size={105} />
              <div><strong>{content.slogan}</strong><small>{content.memberPractice}</small></div>
            </div>
          </div>
        </section>

        <section className="section about-principles">
          <div className="section-heading centered-heading">
            <p className="eyebrow">{content.principlesEyebrow}</p>
            <h2>{content.principlesTitle}</h2>
          </div>
          <blockquote><span>{content.objectiveLabel}</span>{content.objective}</blockquote>
          <div className="about-goals-heading"><span>{content.goalsTitle}</span></div>
          <div className="about-goal-grid">
            {content.goals.map((goal) => (
              <article key={goal.label}><strong>{goal.number}</strong><small>{goal.label}</small><p>{goal.detail}</p></article>
            ))}
          </div>
          <div className="about-principle-grid">
            <article><span><HeartHandshake size={21} /></span><small>{content.missionLabel}</small><p>{content.mission}</p></article>
            <article><span><Activity size={21} /></span><small>{content.memberPracticeLabel}</small><p>{content.memberPractice}</p></article>
            <article><span><Check size={21} /></span><small>{content.standardLabel}</small><p>{content.standard}</p></article>
          </div>
          <div className="about-section-action">
            <Link className="button button-dark" href={`${prefix}/join`}>{content.joinButton}<ArrowRight size={17} /></Link>
          </div>
        </section>

        <section className="about-organization">
          <div className="about-section-shell">
            <div className="section-heading split-heading">
              <div><p className="eyebrow eyebrow-light">{content.organizationEyebrow}</p><h2>{content.organizationTitle}</h2></div>
              <p>{content.organizationDescription}</p>
            </div>
            <div className="about-organization-grid">
              <article><span><Building2 size={23} /></span><div><small>{content.operatingModelLabel}</small><p>{content.operatingModel}</p></div></article>
              <article><span><Stethoscope size={23} /></span><div><small>{content.expertTeamLabel}</small><p>{content.expertTeamDescription}</p></div></article>
              <article className="about-operations-card"><span><Users size={23} /></span><div><small>{content.operationsLabel}</small><p>{content.operations.join(" · ")}</p></div></article>
            </div>
            <div className="about-section-action">
              <Link className="button button-coral" href={`${prefix}/join`}>{content.joinButton}<ArrowRight size={17} /></Link>
            </div>
          </div>
        </section>

        <section className="section about-experts">
          <div className="section-heading split-heading">
            <div><p className="eyebrow">{content.expertsEyebrow}</p><h2>{content.expertsTitle}</h2></div>
            <p>{content.expertsDescription}</p>
          </div>
          <div className="about-expert-list">
            {experts.map((expert, index) => {
              const name = cn ? expert.name_cn : expert.name_en;
              const role = cn ? expert.role_cn : expert.role_en;
              const biography = cn ? expert.biography_cn : expert.biography_en;
              return (
                <details key={expert.id}>
                  <summary>
                    <span className="about-expert-number">{String(index + 1).padStart(2, "0")}</span>
                    <span><strong>{name}</strong><small>{role}</small></span>
                    <span className="about-expert-toggle">+</span>
                  </summary>
                  <div className="about-expert-biography">
                    {biography.split(/\n{2,}/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    {expert.profile_url && (
                      <a href={expert.profile_url} target="_blank" rel="noreferrer">{cn ? "查看机构简介" : "View institutional profile"}<ExternalLink size={13} /></a>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        <section className="about-membership">
          <div className="about-section-shell">
            <div className="section-heading split-heading">
              <div><p className="eyebrow">{content.membershipEyebrow}</p><h2>{content.membershipTitle}</h2></div>
              <p>{content.membershipDescription}</p>
            </div>
            <div className="about-plan-grid">
              {content.plans.map((plan) => (
                <article key={plan.name}>
                  <small>{plan.name}</small>
                  <strong>{plan.price}</strong>
                  <p>{plan.detail}</p>
                  <Link className="about-plan-link" href={`${prefix}/join`}>{content.joinButton}<ArrowRight size={13} /></Link>
                </article>
              ))}
            </div>
            <div className="about-watch-card">
              <span className="about-watch-icon"><Activity size={25} /></span>
              <div><small>{content.watchEyebrow}</small><h3>{content.watchTitle}</h3><p>{content.watchDescription}</p></div>
              <p className="about-health-disclaimer"><ShieldCheck size={16} />{content.healthDisclaimer}</p>
            </div>
          </div>
        </section>

        <section className="section about-contact">
          <div>
            <p className="eyebrow">{content.contactEyebrow}</p>
            <h2>{content.contactTitle}</h2>
          </div>
          <div className="about-contact-list">
            {content.contacts.map((contact) => (
              <a href={`tel:${contact.phone.replace(/\D/g, "")}`} key={contact.phone}><span>{contact.name}</span><strong>{contact.phone}</strong></a>
            ))}
            <Link className="button button-dark" href={`${prefix}/join`}>{content.joinButton}<ArrowRight size={17} /></Link>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
