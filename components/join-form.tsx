"use client";

import { createCopy, type PageCopy } from "@/lib/page-copy";


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

export function JoinForm({locale = "en", copy = {}}: {locale?: "en" | "cn"; copy?: PageCopy}) {
  const copyText = createCopy(copy);
  const cn = locale === "cn";
  const initialFormState: FormState = { status: "idle", message: "" };
  const [state, action, pending] = useActionState(joinClubAction, initialFormState);

  if (state.status === "success") {
    return (
      <div className="form-success" role="status">
        <span className="success-icon"><CheckCircle2 size={32} /></span>
        <p className="eyebrow">{cn ? copyText("申请已收到") : copyText("Application received")}</p>
        <h2>{cn ? copyText("欢迎加入我们的健康社区。") : copyText("You’re part of something good.")}</h2>
        <p>{cn ? copyText("您的会员申请已提交。我们将很快与您联系，确认会员及付款信息。") : copyText("Your membership application has been submitted. We’ll follow up with membership and payment details shortly.")}</p>
        <div className="membership-payment-confirmation">
          <strong>{cn ? copyText("付款方式") : copyText("Payment method")}</strong>
          <span>{cn ? copyText("请根据联系人确认的会员方案，通过 Zelle 支付至 240-498-4568。") : copyText("Pay the amount confirmed for your membership option by Zelle to 240-498-4568.")}</span>
        </div>
        <Link href={cn ? "/cn/member" : "/member"} className="button button-dark">{cn ? copyText("进入会员中心") : copyText("Open member home")} <ArrowRight size={16} /></Link>
      </div>
    );
  }

  return (
    <form action={action} className="join-form">
      <input type="hidden" name="locale" value={locale} />
      <div className="form-row two-columns">
        <label>{cn ? copyText("名字") : copyText("First name")}<input name="firstName" autoComplete="given-name" required /></label>
        <label>{cn ? copyText("姓氏") : copyText("Last name")}<input name="lastName" autoComplete="family-name" required /></label>
      </div>
      <div className="form-row two-columns">
        <label>{cn ? copyText("电子邮箱") : copyText("Email address")}<input name="email" type="email" autoComplete="email" placeholder={copyText("you@example.com")} required /></label>
        <label>{cn ? copyText("手机号码") : copyText("Mobile phone")}<input name="phone" type="tel" autoComplete="tel" placeholder={copyText("(202) 555-0123")} required /></label>
      </div>
      <div className="form-row">
        <label>{cn ? copyText("出生日期") : copyText("Date of birth")} <span className="label-note">{cn ? copyText("选填") : copyText("Optional")}</span><input name="birthday" type="date" /></label>
      </div>
      <fieldset className="membership-payment-fieldset">
        <legend>{cn ? copyText("俱乐部会员年费和支付方式") : copyText("Club annual fee and payment")}</legend>
        <p className="membership-payment-instructions">
          <span>{cn ? copyText("请根据联系人要求选择会员方案。") : copyText("Select the membership option requested by your contact.")}</span>
          <strong>{cn ? copyText("通过 Zelle 支付至：240-498-4568") : copyText("Pay by Zelle to: 240-498-4568")}</strong>
        </p>
        <div className="membership-option-grid">
          {membershipOptions.map((option) => (
            <label className="membership-option" key={option.value}>
              <input type="radio" name="membershipTier" value={option.value} required />
              <span>
                <strong>{copyText(cn ? option.cn : option.en)}</strong>
                <small>{copyText(cn ? option.priceCn : option.priceEn)}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="interest-fieldset">
        <legend>{cn ? copyText("您对哪些内容感兴趣？") : copyText("What interests you?")} <span className="label-note">{cn ? copyText("可多选") : copyText("Choose all that apply")}</span></legend>
        <div className="interest-grid">
          {interests.map((interest) => (
            <label className="choice-pill" key={interest.value}>
              <input type="checkbox" name="interests" value={interest.value} />
              <span>{copyText(cn ? interest.cn : interest.en)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="consent-box">
        <label className="check-line"><input type="checkbox" name="emailOptIn" defaultChecked /> <span>{cn ? copyText("通过电子邮件接收俱乐部新闻、活动和会员优惠。") : copyText("Email me club news, events, and member offers.")}</span></label>
        <label className="check-line"><input type="checkbox" name="smsOptIn" /> <span>{cn ? copyText("通过短信接收重要活动提醒与通知。") : copyText("Text me occasional event reminders and announcements.")}</span></label>
      </div>
      {state.status === "error" && <p className="form-error" role="alert">{copyText(state.message)}</p>}
      <button className="button button-coral button-full" disabled={pending}>
        {pending ? (cn ? copyText("提交中…") : copyText("Submitting…")) : (cn ? copyText("提交会员申请") : copyText("Submit membership application"))}<ArrowRight size={17} />
      </button>
      <p className="form-fineprint">{cn ? copyText("提交申请即表示您同意俱乐部就会员事项与您联系。您可以随时取消推广信息。") : copyText("By applying, you agree that the club may contact you about your membership. You can opt out of promotional messages at any time.")}</p>
    </form>
  );
}
