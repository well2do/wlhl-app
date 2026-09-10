"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";

export function CheckoutButton({ productId, locale, enabled }: { productId: string; locale: "en" | "cn"; enabled: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const cn = locale === "cn";
  async function checkout() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, locale }),
      });
      const result = await response.json();
      if (!response.ok || !result.url || new URL(result.url).hostname !== "checkout.stripe.com") throw new Error("Checkout unavailable");
      window.location.assign(result.url);
    } catch {
      setError(cn ? "暂时无法开始结账，请稍后再试。" : "Unable to start checkout. Please try again shortly.");
      setPending(false);
    }
  }
  return <div>
    <button type="button" className="button button-dark button-full" disabled={!enabled || pending} onClick={checkout}>
      <ShoppingBag size={18} />{pending ? (cn ? "正在打开结账页面…" : "Opening checkout…") : (cn ? "测试结账" : "Test checkout")}
    </button>
    {!enabled && <p className="checkout-message">{cn ? "测试结账正在配置中。" : "Test checkout is being configured."}</p>}
    {error && <p className="checkout-message" role="alert">{error}</p>}
  </div>;
}
