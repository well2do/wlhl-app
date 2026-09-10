import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Stripe from "stripe";
import { createClient, type Client } from "@libsql/client";

const origin = "http://localhost:3127";
const signingSecret = "whsec_local_integration_fixture";
let directory: string;
let server: ChildProcess;
let db: Client;
let productId: string;

before(async () => {
  directory = await mkdtemp(join(tmpdir(), "wlhl-shop-test-"));
  const databaseUrl = `file:${join(directory, "shop.db")}`;
  db = createClient({ url: databaseUrl });
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", "3127"], {
    env: { ...process.env, TURSO_DATABASE_URL: databaseUrl, TURSO_AUTH_TOKEN: "", STRIPE_SECRET_KEY: "sk_test_local_integration_fixture", STRIPE_WEBHOOK_SECRET: signingSecret },
    stdio: "ignore",
  });
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(`${origin}/api/shop/products`);
      if (response.ok) {
        productId = (await response.json()).products[0].id;
        return;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Test server did not start.");
});

after(async () => {
  if (server && server.exitCode === null) {
    const exited = new Promise((resolve) => server.once("exit", resolve));
    server.kill("SIGTERM");
    await exited;
  }
  db?.close();
  if (directory) await rm(directory, { recursive: true, force: true });
});

test("bilingual product pages, cancellation, missing products, and unverified success", async () => {
  for (const prefix of ["", "/cn"]) {
    for (const path of ["/shop", `/shop/${productId}`, `/shop/${productId}?canceled=1`]) {
      const response = await fetch(`${origin}${prefix}${path}`);
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.ok(html.includes(prefix ? "测试" : "Test"));
    }
    assert.equal((await fetch(`${origin}${prefix}/shop/missing-product`)).status, 404);
    const success = await (await fetch(`${origin}${prefix}/shop/success?session_id=forged`)).text();
    assert.ok(success.includes(prefix ? "暂时无法确认付款" : "Unable to confirm payment"));
  }
});

test("checkout rejects cross-origin requests, malformed data, and hidden or missing products", async () => {
  const checkout = (body: string, requestOrigin = origin) => fetch(`${origin}/api/checkout`, {
    method: "POST", headers: { "Content-Type": "application/json", Origin: requestOrigin }, body,
  });
  assert.equal((await checkout(JSON.stringify({ productId, locale: "en" }), "https://example.com")).status, 403);
  assert.equal((await checkout("{")).status, 400);
  assert.equal((await checkout("null")).status, 400);
  assert.equal((await checkout(JSON.stringify({ productId: "missing", locale: "en" }))).status, 404);
  await db.execute({ sql: "UPDATE products SET active = 0 WHERE id = ?", args: [productId] });
  assert.equal((await checkout(JSON.stringify({ productId, locale: "en" }))).status, 404);
  await db.execute({ sql: "UPDATE products SET active = 1 WHERE id = ?", args: [productId] });
});

test("signed paid webhooks persist once; unpaid, tampered, and mismatched events do not", async () => {
  const stripe = new Stripe("sk_test_local_integration_fixture");
  const session = {
    id: "cs_test_fixture", object: "checkout.session", livemode: false, mode: "payment", status: "complete",
    payment_status: "paid", currency: "usd", amount_total: 1800,
    metadata: { app: "wlhl", product_id: productId, product_name: "Test product", unit_amount: "1800" },
  };
  async function send(data: object, tamper = false) {
    const body = JSON.stringify({ id: "evt_fixture", object: "event", type: "checkout.session.completed", livemode: false, data: { object: data } });
    const signature = stripe.webhooks.generateTestHeaderString({ payload: body, secret: signingSecret });
    return fetch(`${origin}/api/stripe/webhook`, { method: "POST", headers: { "stripe-signature": signature }, body: tamper ? `${body} ` : body });
  }
  assert.equal((await send(session, true)).status, 400);
  assert.equal((await send({ ...session, payment_status: "unpaid" })).status, 200);
  assert.equal((await send({ ...session, amount_total: 1 })).status, 500);
  assert.equal(Number((await db.execute("SELECT COUNT(*) AS count FROM shop_orders")).rows[0].count), 0);
  assert.equal((await send(session)).status, 200);
  assert.equal((await send(session)).status, 200);
  assert.equal(Number((await db.execute("SELECT COUNT(*) AS count FROM shop_orders")).rows[0].count), 1);
});
