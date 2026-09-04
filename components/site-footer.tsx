import Link from "next/link";
import { Brand } from "./brand";
import { getLandingPageContent } from "@/lib/db";
import type { LandingPageContent } from "@/lib/landing-page-content";

export async function SiteFooter({ locale = "en", content, logoSrc }: { locale?: "en" | "cn"; content?: LandingPageContent; logoSrc?: string }) {
  const email = process.env.NEXT_PUBLIC_CLUB_EMAIL;
  const phone = process.env.NEXT_PUBLIC_CLUB_PHONE;
  const isChinese = locale === "cn";
  const prefix = isChinese ? "/cn" : "";
  const pageContent = content ?? await getLandingPageContent(locale);
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <Brand inverse href={isChinese ? "/cn" : "/"} name={pageContent.brandName} tagline={pageContent.brandTagline} logoSrc={logoSrc} logoAlt={`${pageContent.brandName} logo`} />
          <p>{pageContent.footerDescription}</p>
        </div>
        <div>
          <p className="footer-label">{pageContent.footerExploreLabel}</p>
          <Link href={`${prefix}/about`}>{pageContent.navAbout}</Link>
          <Link href={`${prefix}/events`}>{pageContent.footerEvents}</Link>
          <Link href={`${prefix}/join`}>{pageContent.footerMembership}</Link>
          <Link href={`${prefix}/#shop`}>{pageContent.footerShop}</Link>
        </div>
        <div>
          <p className="footer-label">{pageContent.footerConnectLabel}</p>
          {email && <a href={`mailto:${email}`}>{email}</a>}
          {phone && <a href={`tel:${phone.replace(/\D/g, "")}`}>{phone}</a>}
          {!email && !phone && <span className="footer-pending">{pageContent.footerContactFallback}</span>}
          <Link href={isChinese ? "/cn/member" : "/member"}>{pageContent.footerMemberPortal}</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} {pageContent.footerCopyright}</span>
        <Link href="/admin/login">{pageContent.footerAdmin}</Link>
      </div>
    </footer>
  );
}
