"use client";

import { useEffect, useState } from "react";

const FUINT_API = process.env.NEXT_PUBLIC_FUINT_API || "https://parsley-easiest-qualify.ngrok-free.dev";

type ArticleItem = { id: number; title: string; brief?: string; description?: string; createTime?: string };

export function LatestNews() {
  const [items, setItems] = useState<ArticleItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    (async () => {
      try {
        const res = await fetch(`${FUINT_API}/clientApi/article/list`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            merchantNo: "10001",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ pageNumber: 1, pageSize: 3 }),
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled || !json?.data?.content) return;
        const content = json.data.content as ArticleItem[];
        if (Array.isArray(content) && content.length > 0) {
          setItems(content);
        }
      } catch {
        // Hide this optional section if the news service is unavailable.
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="latest-news" aria-label="最新动态">
      <div className="latest-news-inner">
        <div className="latest-news-label">最新动态</div>
        <ul className="latest-news-list">
          {items.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong>
              <span>{item.brief || item.description || ""}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
