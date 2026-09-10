import assert from "node:assert/strict";
import test from "node:test";
import Stripe from "stripe";
import { ensureStripePrice, getTestStripe, productAmount } from "../lib/stripe-catalog";
import type { Product } from "../lib/types";

const product: Product = { id: "test-product", name: "Test Tea", description: "A test product", price: 18, category: "Wellness", badge: "", active: 1 };

test("prices are converted to cents and invalid Stripe amounts are rejected", () => {
  assert.equal(productAmount({ price: 19.99 }), 1999);
  assert.equal(productAmount({ price: 0.5 }), 50);
  for (const price of [NaN, Infinity, -1, 0, 0.49, 1000000]) {
    assert.throws(() => productAmount({ price }));
  }
});

test("missing and live credentials cannot enable test checkout", () => {
  const previous = process.env.STRIPE_SECRET_KEY;
  try {
    for (const key of ["", "sk_live_example", "pk_test_example"]) {
      process.env.STRIPE_SECRET_KEY = key;
      assert.throws(() => getTestStripe(), /test secret key/);
    }
  } finally {
    if (previous === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = previous;
  }
});

test("catalog synchronization reuses products and prices, and creates a new price after edits", async () => {
  const products = new Map<string, Record<string, unknown>>();
  const prices = new Map<string, Record<string, unknown>>();
  const stripe = {
    products: {
      retrieve: async (id: string) => {
        if (!products.has(id)) throw new Stripe.errors.StripeInvalidRequestError({ message: "Missing", code: "resource_missing" });
        return products.get(id);
      },
      create: async (data: { id: string }) => {
        const value = { ...data, active: true, livemode: false };
        products.set(data.id, value);
        return value;
      },
      update: async (id: string, data: object) => products.set(id, { ...products.get(id), ...data }),
    },
    prices: {
      list: async ({ lookup_keys }: { lookup_keys: string[] }) => ({ data: prices.has(lookup_keys[0]) ? [prices.get(lookup_keys[0])] : [] }),
      create: async (data: { lookup_key: string }) => {
        const value = { ...data, id: `price_${prices.size}`, livemode: false };
        prices.set(data.lookup_key, value);
        return value;
      },
    },
  } as unknown as Stripe;
  const first = await ensureStripePrice(stripe, product);
  const repeated = await ensureStripePrice(stripe, product);
  assert.equal(first.id, repeated.id);
  assert.equal(products.size, 1);
  assert.equal(prices.size, 1);
  const updated = await ensureStripePrice(stripe, { ...product, price: 24 });
  assert.notEqual(updated.id, first.id);
  assert.equal(updated.unit_amount, 2400);
  assert.equal(products.size, 1);
  assert.equal(prices.size, 2);
});
