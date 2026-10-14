import { notFound } from "next/navigation";
import { NewsPage } from "@/components/news-page";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id))) notFound();
  return <NewsPage locale="cn" articleId={Number(id)} />;
}
