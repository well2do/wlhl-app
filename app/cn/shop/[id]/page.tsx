import { ProductPage } from "@/components/shop-pages";
import { getProduct } from "@/lib/shop";
import { chineseProduct } from "@/lib/chinese";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ canceled?: string }> };
export async function generateMetadata({ params }: Props) {
  const raw = await getProduct((await params).id);
  const product = raw ? chineseProduct(raw) : undefined;
  return { title: product?.name || "商品未找到", description: product?.description };
}
export default async function Page({ params, searchParams }: Props) {
  return <ProductPage id={(await params).id} locale="cn" canceled={(await searchParams).canceled === "1"} />;
}
