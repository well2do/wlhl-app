import { landingImageUrl } from "@/lib/landing-page-content";
import Link from "next/link";
import { Brand } from "./brand";
import { LanguageSwitcher } from "./language-switcher";
import { getLandingPageContent, getLandingPageAssetMetadata } from "@/lib/db";
import type { LandingPageContent } from "@/lib/landing-page-content";

export async function SiteHeader({ locale = "en", content, logoSrc }: { locale?: "en" | "cn"; content?: LandingPageContent; logoSrc?: string }) {
  const isChinese = locale === "cn";
  const prefix = isChinese ? "/cn" : "";
  const pageContent = content ?? await getLandingPageContent(locale);
  const logo = logoSrc ? undefined : (await getLandingPageAssetMetadata()).find((asset) => asset.slot === "logo");
  const resolvedLogo = logoSrc ?? (logo ? landingImageUrl(logo.slot, logo.updated_at) : undefined);
  return (
    <header className="site-header">
      <div className="nav-shell">
        <Brand
          href={isChinese ? "/cn" : "/"}
          name={pageContent.brandName}
          tagline={pageContent.brandTagline}
          logoSrc={resolvedLogo}
          logoAlt={`${pageContent.brandName} logo`}
        />
        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href={`${prefix}/about`}>{pageContent.navAbout}</Link>
          <Link href={`${prefix}/events`}>{pageContent.navEvents}</Link>
          <Link href={`${prefix}/shop`}>{pageContent.navShop}</Link>
        </nav>
        <div className="nav-actions">
          <LanguageSwitcher locale={locale} />
          <Link className="text-link nav-member" href={isChinese ? "/cn/member" : "/member"}>{pageContent.navMember}</Link>
          <Link className="button button-small button-dark" href={`${prefix}/join`}>{pageContent.navJoin}</Link>
        </div>
      </div>
    </header>
  );
}
