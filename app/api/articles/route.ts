import { getPublishedArticles } from "@/lib/articles";

export async function GET() {
  try {
    return Response.json({ articles: await getPublishedArticles() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "The article service is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
