"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PublishedArticle } from "@/lib/articles";

export function ArticleImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed) return null;
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}

export function ArticleFeed({ locale = "cn", preview = false, articleId }: { locale?: "en" | "cn"; preview?: boolean; articleId?: number }) {
  const [items, setItems] = useState<PublishedArticle[] | null>(null);
  const [error, setError] = useState(false);
  const cn = locale === "cn";
  const prefix = cn ? "/cn" : "";
  useEffect(() => {
    let controller: AbortController;
    let stopped = false;
    async function refresh() {
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch("/api/articles", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Articles unavailable");
        const result = await response.json();
        if (!stopped) { setItems(result.articles); setError(false); }
      } catch (error) {
        if (!stopped && !(error instanceof Error && error.name === "AbortError")) setError(true);
      }
    }
    void refresh();
    window.addEventListener("focus", refresh);
    return () => { stopped = true; controller?.abort(); window.removeEventListener("focus", refresh); };
  }, []);

  if (error) return <p role="status">{cn ? "文章暂时无法加载，请稍后刷新重试。" : "Articles are temporarily unavailable. Please refresh to try again."}</p>;
  if (!items) return <p role="status">{cn ? "正在加载文章…" : "Loading articles…"}</p>;
  if (articleId !== undefined) {
    const item = items.find((article) => article.id === articleId);
    if (!item) return <p>{cn ? "这篇文章不存在或尚未发布。" : "This article is unavailable or has not been published."}</p>;
    return <article className="published-article">
      <Link href={`${prefix}/news`}>{cn ? "← 返回全部文章" : "← All articles"}</Link>
      <h1>{item.title}</h1>
      <ArticleImage src={item.image} alt={item.title} />
      {item.brief && <p className="article-brief">{item.brief}</p>}
      <div className="article-body" dangerouslySetInnerHTML={{ __html: item.description }} />
    </article>;
  }
  if (items.length === 0) return preview ? null : <p>{cn ? "暂无已发布文章。" : "No articles have been published yet."}</p>;
  return <>
    <ul className="article-grid">
      {(preview ? items.slice(0, 3) : items).map((item) => <li key={item.id}>
        <Link href={`${prefix}/news/${item.id}`}>
          <ArticleImage src={item.image} alt={item.title} />
          <strong>{item.title}</strong>
          {item.brief && <span>{item.brief}</span>}
        </Link>
      </li>)}
    </ul>
    {preview && <Link className="text-link" href={`${prefix}/news`}>{cn ? "查看全部文章 →" : "View all articles →"}</Link>}
  </>;
}

export function LatestNews({ locale = "cn" }: { locale?: "en" | "cn" }) {
  return <section className="latest-news" aria-label={locale === "cn" ? "最新动态" : "Latest news"}>
    <div className="latest-news-inner">
      <h2 className="latest-news-label">{locale === "cn" ? "最新动态" : "Latest news"}</h2>
      <ArticleFeed locale={locale} preview />
    </div>
  </section>;
}
