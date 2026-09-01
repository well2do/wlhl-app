import Link from "next/link";
import { Brand } from "./brand";
import { LanguageSwitcher } from "./language-switcher";

export function SiteHeader({ locale = "en" }: { locale?: "en" | "cn" }) {
  const isChinese = locale === "cn";
  const prefix = isChinese ? "/cn" : "";
  return (
    <header className="site-header">
      <div className="nav-shell">
        <Brand href={isChinese ? "/cn" : "/"} />
        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href={`${prefix}/#about`}>{isChinese ? "关于我们" : "About"}</Link>
          <Link href={`${prefix}/events`}>{isChinese ? "活动" : "Events"}</Link>
          <Link href={`${prefix}/#shop`}>{isChinese ? "健康产品" : "Wellness shop"}</Link>
        </nav>
        <div className="nav-actions">
          <LanguageSwitcher locale={locale} />
          <Link className="text-link nav-member" href={isChinese ? "/cn/member" : "/member"}>{isChinese ? "会员中心" : "Member access"}</Link>
          <Link className="button button-small button-dark" href={`${prefix}/join`}>{isChinese ? "加入俱乐部" : "Join the club"}</Link>
        </div>
      </div>
    </header>
  );
}
