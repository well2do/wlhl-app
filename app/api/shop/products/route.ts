import { getProducts } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = await getProducts();
  return Response.json({ products }, { headers: { "Cache-Control": "no-store" } });
}
