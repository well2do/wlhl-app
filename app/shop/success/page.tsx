import { CheckoutSuccessPage } from "@/components/shop-pages";
export const dynamic = "force-dynamic";
export const metadata = { title: "Test Checkout", robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  return <CheckoutSuccessPage sessionId={(await searchParams).session_id} />;
}
