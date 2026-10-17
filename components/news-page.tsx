import { ArticleFeed, LatestNews as LatestNewsPreview } from "./latest-news";
import { createCopy } from "@/lib/page-copy";
import { getPageCopy } from "@/lib/page-copy-store";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

export async function LatestNews({ locale = "cn" }: { locale?: "en" | "cn" }) {
  return <LatestNewsPreview locale={locale} copy={await getPageCopy('news', locale)} />;
}

export async function NewsPage({ locale, articleId }: { locale: "en" | "cn"; articleId?: number }) {
  const copy = await getPageCopy('news', locale);
  const copyText = createCopy(copy);
  return <>
    <SiteHeader locale={locale} />
    <main className="news-page">
      {articleId === undefined && <h1>{copyText(locale === "cn" ? "俱乐部动态" : "Club news")}</h1>}
      <ArticleFeed locale={locale} articleId={articleId} copy={copy} />
    </main>
    <SiteFooter locale={locale} />
  </>;
}
