import { NextResponse } from "next/server";
import { getProduct } from "@/lib/shop";
import { ensureStripePrice, getTestStripe, testStripeConfigured } from "@/lib/stripe-catalog";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  if (request.headers.get("origin") !== origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  let input;
  try { input = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!input || typeof input.productId !== "string" || input.productId.length > 100
    || !/^[A-Za-z0-9-]+$/.test(input.productId) || !["en", "cn"].includes(input.locale)) {
    return NextResponse.json({ error: "Invalid product or language." }, { status: 400 });
  }
  if (!testStripeConfigured()) {
    return NextResponse.json({ error: "Test checkout is not configured yet." }, { status: 503 });
  }
  try {
    const product = await getProduct(input.productId);
    if (!product) return NextResponse.json({ error: "Product unavailable." }, { status: 404 });
    const stripe = getTestStripe();
    const price = await ensureStripePrice(stripe, product);
    const prefix = input.locale === "cn" ? "/cn" : "";
    const metadata = { app: "wlhl", product_id: product.id, product_name: product.name, unit_amount: String(price.unit_amount) };
    const session = await stripe.checkout.sessions.create({
      mode: "payment", payment_method_types: ["card"],
      line_items: [{ price: price.id, quantity: 1 }],
      locale: input.locale === "cn" ? "zh" : "en",
      client_reference_id: product.id, metadata, payment_intent_data: { metadata },
      success_url: `${origin}${prefix}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${prefix}/shop/${encodeURIComponent(product.id)}?canceled=1`,
      custom_text: { submit: { message: "Test purchase only. No real charge or product delivery." } },
    });
    if (session.livemode || !session.url) throw new Error("Test checkout is unavailable.");
    return NextResponse.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to start checkout. Please try again later." }, { status: 502 });
  }
}
