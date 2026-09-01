"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function LanguageSwitcher({ locale = "en", inverse = false }: { locale?: "en" | "cn"; inverse?: boolean }) {
  const pathname = usePathname();
  const englishPath = pathname.startsWith("/cn") ? pathname.slice(3) || "/" : pathname;
  const chinesePath = pathname.startsWith("/cn") ? pathname : pathname === "/" ? "/cn" : `/cn${pathname}`;

  return (
    <div className={`language-switcher ${inverse ? "language-switcher-inverse" : ""}`} aria-label="Choose language">
      <Link href={englishPath} className={locale === "en" ? "active" : ""} lang="en">EN</Link>
      <span>/</span>
      <Link href={chinesePath} className={locale === "cn" ? "active" : ""} lang="zh-CN">中文</Link>
    </div>
  );
}
