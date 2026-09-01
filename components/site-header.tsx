import Link from "next/link";
import { Brand } from "./brand";
import { LanguageSwitcher } from "./language-switcher";
import type { LandingPageContent } from "@/lib/landing-page-content";

export function SiteHeader({ locale = "en", content, logoSrc }: { locale?: "en" | "cn"; content?: LandingPageContent; logoSrc?: string }) {
  const isChinese = locale === "cn";
  const prefix = isChinese ? "/cn" : "";
  return (
    <header className="site-header">
      <div className="nav-shell">
        <Brand
          href={isChinese ? "/cn" : "/"}
          name={content?.brandName}
          tagline={content?.brandTagline}
          logoSrc={logoSrc}
          logoAlt={content ? `${content.brandName} logo` : ""}
        />
        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href={`${prefix}/#about`}>{isChinese ? "关于我们" : content?.navAbout ?? "About"}</Link>
          <Link href={`${prefix}/events`}>{isChinese ? "活动" : content?.navEvents ?? "Events"}</Link>
          <Link href={`${prefix}/#shop`}>{isChinese ? "健康产品" : content?.navShop ?? "Wellness shop"}</Link>
        </nav>
        <div className="nav-actions">
          <LanguageSwitcher locale={locale} />
          <Link className="text-link nav-member" href={isChinese ? "/cn/member" : "/member"}>{isChinese ? "会员中心" : content?.navMember ?? "Member access"}</Link>
          <Link className="button button-small button-dark" href={`${prefix}/join`}>{isChinese ? "加入俱乐部" : content?.navJoin ?? "Join the club"}</Link>
        </div>
      </div>
    </header>
  );
}
