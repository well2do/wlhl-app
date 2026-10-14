import sanitizeHtml from "sanitize-html";
import { contentMediaUrl } from "./content-media";

export type PublishedArticle = { id: number; title: string; brief: string; image: string; description: string; createTime: number; updateTime: number; sort: number };

export function sanitizeArticleHtml(html: string, upstream?: string) {
  return sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "video", "source"],
    allowedAttributes: {
      a: ["href", "title", "rel"], img: ["src", "alt", "width", "height"],
      video: ["src", "controls", "playsinline"], source: ["src", "type"],
      "*": ["class"],
    },
    allowedClasses: { "*": ["ql-align-center", "ql-align-right", "ql-align-justify", "ql-size-small", "ql-size-large", "ql-size-huge"] },
    allowedSchemes: ["https", "mailto"],
    allowProtocolRelative: false,
    transformTags: {
      img: (_tag, attrs) => ({ tagName: "img", attribs: { ...attrs, src: contentMediaUrl(attrs.src || "", upstream) } }),
      video: (_tag, attrs) => ({ tagName: "video", attribs: { ...attrs, src: contentMediaUrl(attrs.src || "", upstream), controls: "", playsinline: "" } }),
      source: (_tag, attrs) => ({ tagName: "source", attribs: { ...attrs, src: contentMediaUrl(attrs.src || "", upstream) } }),
      a: (_tag, attrs) => ({ tagName: "a", attribs: { ...attrs, rel: "noopener noreferrer" } }),
    },
  });
}

export async function getPublishedArticles(): Promise<PublishedArticle[]> {
  const base = process.env.FUINT_API_URL || process.env.NEXT_PUBLIC_FUINT_API || "https://parsley-easiest-qualify.ngrok-free.dev";
  const articles = new Map<number, PublishedArticle>();
  let page = 1;
  let totalPages = 1;
  do {
    const response = await fetch(new URL("/clientApi/article/list", base), {
      method: "POST",
      headers: { "Content-Type": "application/json", merchantNo: process.env.FUINT_MERCHANT_NO || "10001", "ngrok-skip-browser-warning": "true" },
      body: JSON.stringify({ page, pageSize: 100 }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("The article service is unavailable.");
    const result = await response.json();
    if (result.code !== 200 || !Array.isArray(result.data?.content)) throw new Error("The article service returned an invalid response.");
    totalPages = Number(result.data.totalPage) || 1;
    for (const row of result.data.content) {
      if (row.status !== "A" || !Number.isSafeInteger(row.id) || typeof row.title !== "string") continue;
      articles.set(row.id, {
        id: row.id, title: row.title, brief: String(row.brief || ""),
        image: contentMediaUrl(String(row.image || ""), base),
        description: sanitizeArticleHtml(String(row.description || ""), base),
        createTime: Number(row.createTime) || 0, updateTime: Number(row.updateTime) || 0, sort: Number(row.sort) || 0,
      });
    }
    page++;
  } while (page <= totalPages);
  return [...articles.values()].sort((a, b) => a.sort - b.sort || b.updateTime - a.updateTime || b.id - a.id);
}
