import { getTestStripe } from "@/lib/stripe-catalog";
import { recordPaidCheckout } from "@/lib/shop";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook is not configured.", { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature.", { status: 400 });
  let event;
  try {
    event = getTestStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return new Response("Invalid signature.", { status: 400 });
  }
  if (event.livemode) return new Response("Live events are disabled.", { status: 400 });
  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await recordPaidCheckout(event.data.object);
    }
    return Response.json({ received: true });
  } catch {
    return new Response("Unable to record payment. Please retry.", { status: 500 });
  }
}
