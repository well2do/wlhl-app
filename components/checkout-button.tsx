"use client";

import { createCopy, type PageCopy } from "@/lib/page-copy";


import { useState } from "react";
import { ShoppingBag } from "lucide-react";

export function CheckoutButton({productId, locale, enabled, copy = {}}: {productId: string; locale: "en" | "cn"; enabled: boolean; copy?: PageCopy}) {
  const copyText = createCopy(copy);
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
      <ShoppingBag size={18} />{pending ? (cn ? copyText("正在打开结账页面…") : copyText("Opening checkout…")) : (cn ? copyText("测试结账") : copyText("Test checkout"))}
    </button>
    {!enabled && <p className="checkout-message">{cn ? copyText("测试结账正在配置中。") : copyText("Test checkout is being configured.")}</p>}
    {error && <p className="checkout-message" role="alert">{error}</p>}
  </div>;
}
