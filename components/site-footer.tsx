import Link from "next/link";
import { Brand } from "./brand";
import type { LandingPageContent } from "@/lib/landing-page-content";

export function SiteFooter({ locale = "en", content, logoSrc }: { locale?: "en" | "cn"; content?: LandingPageContent; logoSrc?: string }) {
  const email = process.env.NEXT_PUBLIC_CLUB_EMAIL;
  const phone = process.env.NEXT_PUBLIC_CLUB_PHONE;
  const isChinese = locale === "cn";
  const prefix = isChinese ? "/cn" : "";
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <Brand inverse href={isChinese ? "/cn" : "/"} name={content?.brandName} tagline={content?.brandTagline} logoSrc={logoSrc} logoAlt={content ? `${content.brandName} logo` : ""} />
          <p>{isChinese ? "华盛顿地区温暖友善的健康生活社区，让每个年龄阶段都能更健康、更有活力、更有连接。" : content?.footerDescription ?? "A welcoming Washington, D.C. community making healthy, connected living easier at every age."}</p>
        </div>
        <div>
          <p className="footer-label">{isChinese ? "探索" : content?.footerExploreLabel ?? "Explore"}</p>
          <Link href={`${prefix}/about`}>{isChinese ? "关于我们" : content?.navAbout ?? "About"}</Link>
          <Link href={`${prefix}/events`}>{isChinese ? "活动" : content?.footerEvents ?? "Events"}</Link>
          <Link href={`${prefix}/join`}>{isChinese ? "会员申请" : content?.footerMembership ?? "Membership"}</Link>
          <Link href={`${prefix}/#shop`}>{isChinese ? "健康产品" : content?.footerShop ?? "Wellness shop"}</Link>
        </div>
        <div>
          <p className="footer-label">{isChinese ? "联系我们" : content?.footerConnectLabel ?? "Connect"}</p>
          {email && <a href={`mailto:${email}`}>{email}</a>}
          {phone && <a href={`tel:${phone.replace(/\D/g, "")}`}>{phone}</a>}
          {!email && !phone && <span className="footer-pending">{isChinese ? "联系信息即将公布" : content?.footerContactFallback ?? "Contact details coming soon"}</span>}
          <Link href={isChinese ? "/cn/member" : "/member"}>{isChinese ? "会员中心" : content?.footerMemberPortal ?? "Member portal"}</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} {isChinese ? "Washington Longevity Healthy Life Club" : content?.footerCopyright ?? "Washington Longevity Healthy Life Club"}</span>
        <Link href="/admin/login">{isChinese ? "俱乐部管理" : content?.footerAdmin ?? "Club administration"}</Link>
      </div>
    </footer>
  );
}
