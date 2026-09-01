"use client";

import { useState } from "react";
import { Bell, BellRing, LoaderCircle } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(window.atob(base64), (character) => character.charCodeAt(0));
}

export function NotificationButton({ publicKey, locale = "en" }: { publicKey?: string; locale?: "en" | "cn" }) {
  const [status, setStatus] = useState<"idle" | "loading" | "on" | "error">("idle");
  const cn = locale === "cn";

  async function subscribe() {
    if (!publicKey || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Permission not granted");
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });
      if (!response.ok) throw new Error("Could not save subscription");
      setStatus("on");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="notification-control">
      <button className="button button-light" onClick={subscribe} disabled={status === "loading" || status === "on"}>
        {status === "loading" ? <LoaderCircle className="spin" size={18} /> : status === "on" ? <BellRing size={18} /> : <Bell size={18} />}
        {status === "on" ? (cn ? "通知已开启" : "Notifications are on") : status === "loading" ? (cn ? "正在设置…" : "Setting up…") : (cn ? "开启活动通知" : "Turn on notifications")}
      </button>
      {status === "error" && <small>{cn ? "暂时无法开启浏览器通知，您仍可通过电子邮件接收更新。" : "Notifications aren’t available yet. You can still receive email updates."}</small>}
    </div>
  );
}
