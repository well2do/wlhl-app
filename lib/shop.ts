import "server-only";
import type Stripe from "stripe";
import { execute } from "./db";
import type { Product } from "./types";

export async function getProduct(id: string) {
  const result = await execute("SELECT * FROM products WHERE id = ? AND active = 1 LIMIT 1", [id]);
  return result.rows[0] as unknown as Product | undefined;
}

export async function recordPaidCheckout(session: Stripe.Checkout.Session) {
  if (session.livemode || session.metadata?.app !== "wlhl" || session.mode !== "payment"
    || session.payment_status !== "paid" || session.status !== "complete") return;
  const productId = session.metadata.product_id;
  const expectedAmount = Number(session.metadata.unit_amount);
  if (!productId || !Number.isSafeInteger(expectedAmount) || expectedAmount < 50
    || session.amount_total !== expectedAmount || session.currency !== "usd") {
    throw new Error("Paid checkout does not match the expected order.");
  }
  await execute(
    `INSERT OR IGNORE INTO shop_orders
      (stripe_session_id, product_id, product_name, amount_total, currency, payment_status, created_at)
      VALUES (?, ?, ?, ?, ?, 'paid', ?)`,
    [session.id, productId, session.metadata.product_name || "", expectedAmount, "usd", new Date().toISOString()],
  );
}
