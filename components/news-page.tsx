import { ArticleFeed } from "./latest-news";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

export function NewsPage({ locale, articleId }: { locale: "en" | "cn"; articleId?: number }) {
  return <>
    <SiteHeader locale={locale} />
    <main className="news-page">
      {articleId === undefined && <h1>{locale === "cn" ? "俱乐部动态" : "Club news"}</h1>}
      <ArticleFeed locale={locale} articleId={articleId} />
    </main>
    <SiteFooter locale={locale} />
  </>;
}
