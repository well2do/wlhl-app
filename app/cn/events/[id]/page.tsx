import { EventDetailPage } from "@/components/event-detail-page";
export const metadata = { title: "俱乐部活动" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventDetailPage id={id} locale="cn" />;
}
