import { createHash } from "node:crypto";
import Stripe from "stripe";
import type { Product } from "./types";

export function testStripeConfigured() {
  return /^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY || "");
}

export function getTestStripe() {
  if (!testStripeConfigured()) throw new Error("A Stripe test secret key is required. Live payments are disabled.");
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { maxNetworkRetries: 2, timeout: 20000 });
}

export function productAmount(product: Pick<Product, "price">) {
  const amount = Math.round(Number(product.price) * 100);
  if (!Number.isSafeInteger(amount) || amount < 50 || amount > 99999999) {
    throw new Error("Product price must be between USD 0.50 and USD 999,999.99.");
  }
  return amount;
}

export async function ensureStripePrice(stripe: Stripe, product: Product) {
  const amount = productAmount(product);
  const digest = createHash("sha256").update(product.id).digest("hex").slice(0, 32);
  const productId = `wlhl_${digest}`;
  let stripeProduct;
  try {
    stripeProduct = await stripe.products.retrieve(productId);
  } catch (error) {
    if (!(error instanceof Stripe.errors.StripeInvalidRequestError) || error.code !== "resource_missing") throw error;
    try {
      stripeProduct = await stripe.products.create({
        id: productId, name: product.name, description: product.description,
        metadata: { app: "wlhl", product_id: product.id },
      }, { idempotencyKey: `wlhl-product-${digest}` });
    } catch (creationError) {
      if (!(creationError instanceof Stripe.errors.StripeInvalidRequestError) || creationError.code !== "resource_already_exists") throw creationError;
      stripeProduct = await stripe.products.retrieve(productId);
    }
  }
  if (stripeProduct.deleted || !stripeProduct.active || stripeProduct.livemode) throw new Error("Stripe test product is unavailable.");
  if (stripeProduct.name !== product.name || stripeProduct.description !== product.description) {
    await stripe.products.update(productId, { name: product.name, description: product.description });
  }
  const lookupKey = `wlhl_${digest}_usd_${amount}`;
  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  const price = existing.data[0] || await stripe.prices.create({
    product: productId, unit_amount: amount, currency: "usd", lookup_key: lookupKey,
    metadata: { app: "wlhl", product_id: product.id },
  }, { idempotencyKey: lookupKey });
  if (price.livemode || price.product !== productId || price.unit_amount !== amount || price.currency !== "usd") {
    throw new Error("Stripe price does not match the shop product.");
  }
  return price;
}
