import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Leaf, ShieldCheck } from "lucide-react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { CheckoutButton } from "./checkout-button";
import { getProducts, getLandingPageAssetMetadata } from "@/lib/db";
import { getProduct, recordPaidCheckout } from "@/lib/shop";
import { getTestStripe, productAmount, testStripeConfigured } from "@/lib/stripe-catalog";
import { chineseProduct } from "@/lib/chinese";
import { formatCurrency } from "@/lib/format";

type Locale = "en" | "cn";

function TestNotice({ locale }: { locale: Locale }) {
  return <div className="shop-test-notice"><ShieldCheck size={22} /><p>{locale === "cn"
    ? "测试商店：购买仅用于测试付款流程，不会实际扣款，也不会配送商品。"
    : "Test shop: purchases only test the payment flow. No real charges or product deliveries."}</p></div>;
}

export async function ShopPage({ locale = "en" }: { locale?: Locale }) {
  const cn = locale === "cn";
  const prefix = cn ? "/cn" : "";
  const [products, assets] = await Promise.all([getProducts(), getLandingPageAssetMetadata()]);
  return <><SiteHeader locale={locale} /><main className="section shop-page">
    <div className="section-heading"><p className="eyebrow">{cn ? "用心选择，健康生活" : "Small rituals, everyday wellness"}</p><h1>{cn ? "健康商店" : "The wellness shop"}</h1><p>{cn ? "探索我们的健康产品，体验安全便捷的结账流程。" : "Explore our club-selected essentials and try a secure test checkout."}</p></div>
    <TestNotice locale={locale} />
    <div className="product-grid">{products.map((raw, index) => {
      const product = cn ? chineseProduct(raw) : raw;
      const asset = assets.find((item) => item.slot === `product-${product.id}`);
      const href = `${prefix}/shop/${encodeURIComponent(product.id)}`;
      return <article className="product-card" key={product.id}>
        <Link href={href} aria-label={product.name} className={`product-art product-art-${index % 3 + 1} ${asset ? "has-upload" : ""}`}>
          {asset ? <img className="landing-cover-image" src={`/api/landing-page-assets/${asset.slot}?v=${encodeURIComponent(asset.updated_at)}`} alt={product.name} /> : <Leaf size={76} />}
          {product.badge && <span className="product-badge">{product.badge}</span>}
        </Link>
        <div className="product-copy"><small>{product.category}</small><h2 className="shop-card-title"><Link href={href}>{product.name}</Link></h2><p>{product.description}</p>
          <div><strong>{formatCurrency(Number(product.price))}</strong><Link href={href} aria-label={cn ? `查看${product.name}` : `View ${product.name}`}><ArrowRight size={18} /></Link></div>
        </div>
      </article>;
    })}</div>
    {!products.length && <p>{cn ? "目前没有在售商品，请稍后再来。" : "There are no products available. Please check back soon."}</p>}
  </main><SiteFooter locale={locale} /></>;
}

export async function ProductPage({ id, locale = "en", canceled = false }: { id: string; locale?: Locale; canceled?: boolean }) {
  const raw = await getProduct(id);
  if (!raw) notFound();
  const cn = locale === "cn";
  const product = cn ? chineseProduct(raw) : raw;
  const assets = await getLandingPageAssetMetadata();
  const asset = assets.find((item) => item.slot === `product-${id}`);
  let purchasable = testStripeConfigured();
  try { productAmount(raw); } catch { purchasable = false; }
  return <><SiteHeader locale={locale} /><main className="section shop-page">
    <Link className="shop-back-link" href={`${cn ? "/cn" : ""}/shop`}><ArrowLeft size={16} />{cn ? "返回商店" : "Back to the shop"}</Link>
    <TestNotice locale={locale} />
    {canceled && <p className="shop-cancel-notice" role="status">{cn ? "你已返回商品页面，可以再次尝试结账。" : "You returned from checkout. You can try again when you are ready."}</p>}
    <div className="product-detail">
      <div className={`product-art product-art-1 product-detail-art ${asset ? "has-upload" : ""}`}>
        {asset ? <img className="landing-cover-image" src={`/api/landing-page-assets/${asset.slot}?v=${encodeURIComponent(asset.updated_at)}`} alt={product.name} /> : <Leaf size={130} />}
        {product.badge && <span className="product-badge">{product.badge}</span>}
      </div>
      <div className="product-detail-copy"><p className="eyebrow">{product.category}</p><h1>{product.name}</h1><p>{product.description}</p>
        <p className="product-detail-price">{formatCurrency(Number(product.price))} <small>USD</small></p>
        <CheckoutButton productId={id} locale={locale} enabled={purchasable} />
        <p className="checkout-message">{cn ? "数量：1。通过 Stripe 安全结账。" : "Quantity: 1. Secure checkout with Stripe."}</p>
      </div>
    </div>
  </main><SiteFooter locale={locale} /></>;
}

export async function CheckoutSuccessPage({ sessionId, locale = "en" }: { sessionId?: string; locale?: Locale }) {
  const cn = locale === "cn";
  let state: "paid" | "pending" | "unavailable" = "unavailable";
  let productName = "";
  let amount = 0;
  if (sessionId && /^cs_test_[A-Za-z0-9]+$/.test(sessionId) && sessionId.length < 250) {
    try {
      const session = await getTestStripe().checkout.sessions.retrieve(sessionId);
      if (!session.livemode && session.metadata?.app === "wlhl") {
        state = "pending";
        if (session.status === "complete" && session.payment_status === "paid") {
          await recordPaidCheckout(session);
          state = "paid";
          productName = session.metadata.product_name || "";
          amount = (session.amount_total || 0) / 100;
        }
      }
    } catch { state = "unavailable"; }
  }
  return <><SiteHeader locale={locale} /><main className="section shop-page checkout-result">
    <ShieldCheck size={48} /><p className="eyebrow">{cn ? "测试结账" : "Test checkout"}</p>
    <h1>{state === "paid" ? (cn ? "测试付款成功" : "Test payment successful") : state === "pending" ? (cn ? "付款尚未完成" : "Payment is not complete") : (cn ? "暂时无法确认付款" : "Unable to confirm payment")}</h1>
    {state === "paid" ? <p>{productName} · {formatCurrency(amount)} USD<br />{cn ? "测试付款已确认并记录，不会实际扣款或配送商品。" : "Your test payment is confirmed and recorded. No real money was charged and no product will be delivered."}</p>
      : <p>{cn ? "我们尚未确认付款成功。如果刚刚完成结账，请稍后刷新此页面。" : "We have not confirmed a successful payment. If you just checked out, refresh this page shortly."}</p>}
    <Link className="button button-dark" href={`${cn ? "/cn" : ""}/shop`}>{cn ? "返回商店" : "Back to the shop"}<ArrowRight size={17} /></Link>
  </main><SiteFooter locale={locale} /></>;
}
