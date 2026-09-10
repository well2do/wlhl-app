import { ProductPage } from "@/components/shop-pages";
import { getProduct } from "@/lib/shop";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ canceled?: string }> };
export async function generateMetadata({ params }: Props) {
  const product = await getProduct((await params).id);
  return { title: product?.name || "Product not found", description: product?.description };
}
export default async function Page({ params, searchParams }: Props) {
  return <ProductPage id={(await params).id} canceled={(await searchParams).canceled === "1"} />;
}
