import { EventManagerForm } from '@/components/event-manager-form';
export const metadata = { title: '网站活动管理', robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  const { event } = await searchParams;
  return <EventManagerForm initialEventId={event} />;
}
