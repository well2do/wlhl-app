import { loadEnvConfig } from "@next/env";
import { getTestStripe, ensureStripePrice } from "../lib/stripe-catalog";
import type { Product } from "../lib/types";

loadEnvConfig(process.cwd());

async function main() {
  const stripe = getTestStripe();
  const siteIndex = process.argv.indexOf("--site");
  let products: Product[];
  if (siteIndex !== -1) {
    const site = new URL(process.argv[siteIndex + 1]);
    if (site.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(site.hostname)) throw new Error("Use an HTTPS shop URL.");
    const response = await fetch(new URL("/api/shop/products", site));
    if (!response.ok) throw new Error("Unable to read the shop catalog.");
    products = (await response.json()).products;
  } else {
    const { getProducts } = await import("../lib/db");
    products = await getProducts();
  }
  if (!Array.isArray(products) || products.length === 0) throw new Error("No active shop products found.");
  for (const product of products) {
    const price = await ensureStripePrice(stripe, product);
    console.log(`${product.name}: ${price.id} (${price.unit_amount! / 100} USD, test mode)`);
  }
}

main().catch(() => {
  console.error("Stripe sync failed. Check STRIPE_SECRET_KEY (test mode), database access, and the shop URL. No credentials are logged.");
  process.exitCode = 1;
});
