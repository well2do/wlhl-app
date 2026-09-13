"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { joinClubAction, type FormState } from "@/app/actions";

const interests = [
  { value: "Movement", en: "Movement", cn: "运动健身" },
  { value: "Nutrition", en: "Nutrition", cn: "营养健康" },
  { value: "Healthy aging", en: "Healthy aging", cn: "健康长寿" },
  { value: "Mindfulness", en: "Mindfulness", cn: "正念生活" },
  { value: "Community outings", en: "Community outings", cn: "社区活动" },
  { value: "Wellness products", en: "Wellness products", cn: "健康产品" },
];

const membershipOptions = [
  {
    value: "Annual Membership (2026 Promotion)",
    en: "Annual membership",
    cn: "年度会员",
    priceEn: "$360/year · 2026 half-price offer: $180/year",
    priceCn: "$360/年 · 2026年半价优惠：$180/年",
  },
  {
    value: "2026 Annual Renewal",
    en: "2026 annual renewal",
    cn: "2026年度续费",
    priceEn: "$66 for 2026",
    priceCn: "2026年度 $66",
  },
  {
    value: "Lifetime Membership",
    en: "Lifetime membership",
    cn: "终身会员",
    priceEn: "$980 one-time",
    priceCn: "一次性 $980",
  },
] as const;

export function JoinForm({ locale = "en" }: { locale?: "en" | "cn" }) {
  const cn = locale === "cn";
  const initialFormState: FormState = { status: "idle", message: "" };
  const [state, action, pending] = useActionState(joinClubAction, initialFormState);

  if (state.status === "success") {
    return (
      <div className="form-success" role="status">
        <span className="success-icon"><CheckCircle2 size={32} /></span>
        <p className="eyebrow">{cn ? "申请已收到" : "Application received"}</p>
        <h2>{cn ? "欢迎加入我们的健康社区。" : "You’re part of something good."}</h2>
        <p>{cn ? "您的 WLHL 会员申请已提交。我们将很快与您联系，确认会员及付款信息。" : `${state.message} We’ll follow up with membership and payment details shortly.`}</p>
        <div className="membership-payment-confirmation">
          <strong>{cn ? "付款方式" : "Payment method"}</strong>
          <span>{cn ? "请根据联系人确认的会员方案，通过 Zelle 支付至 240-498-4568。" : "Pay the amount confirmed for your membership option by Zelle to 240-498-4568."}</span>
        </div>
        <Link href={cn ? "/cn/member" : "/member"} className="button button-dark">{cn ? "进入会员中心" : "Open member home"} <ArrowRight size={16} /></Link>
      </div>
    );
  }

  return (
    <form action={action} className="join-form">
      <input type="hidden" name="locale" value={locale} />
      <div className="form-row two-columns">
        <label>{cn ? "名字" : "First name"}<input name="firstName" autoComplete="given-name" required /></label>
        <label>{cn ? "姓氏" : "Last name"}<input name="lastName" autoComplete="family-name" required /></label>
      </div>
      <div className="form-row two-columns">
        <label>{cn ? "电子邮箱" : "Email address"}<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
        <label>{cn ? "手机号码" : "Mobile phone"}<input name="phone" type="tel" autoComplete="tel" placeholder="(202) 555-0123" required /></label>
      </div>
      <div className="form-row">
        <label>{cn ? "出生日期" : "Date of birth"} <span className="label-note">{cn ? "选填" : "Optional"}</span><input name="birthday" type="date" /></label>
      </div>
      <fieldset className="membership-payment-fieldset">
        <legend>{cn ? "俱乐部会员年费和支付方式" : "Club annual fee and payment"}</legend>
        <p className="membership-payment-instructions">
          <span>{cn ? "请根据联系人要求选择会员方案。" : "Select the membership option requested by your contact."}</span>
          <strong>{cn ? "通过 Zelle 支付至：240-498-4568" : "Pay by Zelle to: 240-498-4568"}</strong>
        </p>
        <div className="membership-option-grid">
          {membershipOptions.map((option) => (
            <label className="membership-option" key={option.value}>
              <input type="radio" name="membershipTier" value={option.value} required />
              <span>
                <strong>{cn ? option.cn : option.en}</strong>
                <small>{cn ? option.priceCn : option.priceEn}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="interest-fieldset">
        <legend>{cn ? "您对哪些内容感兴趣？" : "What interests you?"} <span className="label-note">{cn ? "可多选" : "Choose all that apply"}</span></legend>
        <div className="interest-grid">
          {interests.map((interest) => (
            <label className="choice-pill" key={interest.value}>
              <input type="checkbox" name="interests" value={interest.value} />
              <span>{cn ? interest.cn : interest.en}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="consent-box">
        <label className="check-line"><input type="checkbox" name="emailOptIn" defaultChecked /> <span>{cn ? "通过电子邮件接收俱乐部新闻、活动和会员优惠。" : "Email me club news, events, and member offers."}</span></label>
        <label className="check-line"><input type="checkbox" name="smsOptIn" /> <span>{cn ? "通过短信接收重要活动提醒与通知。" : "Text me occasional event reminders and announcements."}</span></label>
      </div>
      {state.status === "error" && <p className="form-error" role="alert">{state.message}</p>}
      <button className="button button-coral button-full" disabled={pending}>
        {pending ? (cn ? "提交中…" : "Submitting…") : (cn ? "提交会员申请" : "Submit membership application")}<ArrowRight size={17} />
      </button>
      <p className="form-fineprint">{cn ? "提交申请即表示您同意 WLHL 就会员事项与您联系。您可以随时取消推广信息。" : "By applying, you agree that WLHL may contact you about your membership. You can opt out of promotional messages at any time."}</p>
    </form>
  );
}
