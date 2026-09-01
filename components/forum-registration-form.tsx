"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarCheck2, CheckCircle2, MapPin } from "lucide-react";
import { forumRegistrationAction, type FormState } from "@/app/actions";

export function ForumRegistrationForm({ locale = "en" }: { locale?: "en" | "cn" }) {
  const initialState: FormState = { status: "idle", message: "" };
  const [state, action, pending] = useActionState(forumRegistrationAction, initialState);

  if (state.status === "success") {
    return (
      <div className="forum-success" role="status">
        <span><CheckCircle2 size={34} /></span>
        <p className="forum-kicker">Registration confirmed · 报名成功</p>
        <h2>We saved your seat.<br /><em>期待与您见面。</em></h2>
        <p>{state.message}</p>
        <div className="forum-confirmation-details">
          <div><CalendarCheck2 size={18} /><span><strong>September 7, 2026</strong>2:00–5:00 PM</span></div>
          <div><MapPin size={18} /><span><strong>7361 Calhoun Place</strong>Rockville, MD 20855</span></div>
        </div>
        <Link className="forum-button" href={locale === "cn" ? "/cn/member" : "/member"}>{locale === "cn" ? "进入会员中心" : "Open member home"} <ArrowRight size={17} /></Link>
      </div>
    );
  }

  return (
    <form action={action} className="forum-form">
      <div className="forum-form-heading">
        <p className="forum-kicker">Reserve your seat · 预约席位</p>
        <h2>Event registration<br /><em>活动报名</em></h2>
        <p>Registration is complimentary. Please submit one form per attendee.<br />本次活动免费参加，请每位参会者单独填写。</p>
      </div>

      <div className="forum-form-grid two">
        <label>First name <span>名字</span><input name="firstName" autoComplete="given-name" required /></label>
        <label>Last name <span>姓氏</span><input name="lastName" autoComplete="family-name" required /></label>
      </div>
      <div className="forum-form-grid two">
        <label>Email <span>电子邮箱</span><input name="email" type="email" autoComplete="email" required /></label>
        <label>Mobile phone <span>手机号码</span><input name="phone" type="tel" autoComplete="tel" required /></label>
      </div>
      <div className="forum-form-grid two">
        <label>Organization <span>公司／机构</span><input name="organization" autoComplete="organization" /></label>
        <label>Title or role <span>职位</span><input name="jobTitle" autoComplete="organization-title" /></label>
      </div>
      <div className="forum-form-grid two">
        <label>Preferred language <span>语言偏好</span>
          <select name="languagePreference" defaultValue="Bilingual"><option>English</option><option>中文</option><option>Bilingual</option></select>
        </label>
        <label>How did you hear about us? <span>如何得知活动</span>
          <select name="referralSource" defaultValue=""><option value="">Select · 请选择</option><option>Friend or colleague</option><option>WeChat</option><option>WLHL Club</option><option>Partner organization</option><option>Social media</option><option>Other</option></select>
        </label>
      </div>
      <label>Accessibility or other notes <span>无障碍需求或其他备注</span><textarea name="accessibilityNotes" rows={3} placeholder="Optional · 选填" /></label>

      <label className="forum-consent">
        <input type="checkbox" name="marketingOptIn" defaultChecked />
        <span>Send me future WLHL event and community updates.<small>接收 WLHL 今后的活动与社区通知。</small></span>
      </label>

      {state.status === "error" && <p className="forum-form-error" role="alert">{state.message}</p>}
      <button className="forum-button" disabled={pending}>{pending ? "Registering… · 提交中…" : "Complete registration · 完成报名"}<ArrowRight size={17} /></button>
      <p className="forum-privacy">Your information is used only for event operations and the updates you select. · 您的信息仅用于活动管理及您选择接收的通知。</p>
    </form>
  );
}
