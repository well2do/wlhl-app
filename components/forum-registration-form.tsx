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
        <p className="forum-kicker">{locale === "cn" ? "报名成功" : "Registration confirmed"}</p>
        <h2>{locale === "cn" ? <>您的席位已确认。<br /><em>期待与您见面。</em></> : <>We saved your seat.<br /><em>See you there.</em></>}</h2>
        <p>{state.message}</p>
        <div className="forum-confirmation-details">
          <div><CalendarCheck2 size={18} /><span><strong>{locale === "cn" ? "2026年9月7日" : "September 7, 2026"}</strong>{locale === "cn" ? "下午 2:00–5:00" : "2:00–5:00 PM"}</span></div>
          <div><MapPin size={18} /><span><strong>7361 Calhoun Place</strong>Rockville, MD 20855</span></div>
        </div>
        <Link className="forum-button" href={locale === "cn" ? "/cn/member" : "/member"}>{locale === "cn" ? "进入会员中心" : "Open member home"} <ArrowRight size={17} /></Link>
      </div>
    );
  }

  return (
    <form action={action} className="forum-form">
      <input type="hidden" name="locale" value={locale} />
      <div className="forum-form-heading">
        <p className="forum-kicker">{locale === "cn" ? "预约席位" : "Reserve your seat"}</p>
        <h2>{locale === "cn" ? "活动报名" : "Event registration"}</h2>
        <p>{locale === "cn" ? "本次活动免费参加，请每位参会者单独填写。" : "Registration is complimentary. Please submit one form per attendee."}</p>
      </div>

      <div className="forum-form-grid two">
        <label>{locale === "cn" ? "名字" : "First name"}<input name="firstName" autoComplete="given-name" required /></label>
        <label>{locale === "cn" ? "姓氏" : "Last name"}<input name="lastName" autoComplete="family-name" required /></label>
      </div>
      <div className="forum-form-grid two">
        <label>{locale === "cn" ? "电子邮箱" : "Email"}<input name="email" type="email" autoComplete="email" required /></label>
        <label>{locale === "cn" ? "手机号码" : "Mobile phone"}<input name="phone" type="tel" autoComplete="tel" required /></label>
      </div>
      <div className="forum-form-grid two">
        <label>{locale === "cn" ? "公司／机构" : "Organization"}<input name="organization" autoComplete="organization" /></label>
        <label>{locale === "cn" ? "职位" : "Title or role"}<input name="jobTitle" autoComplete="organization-title" /></label>
      </div>
      <div className="forum-form-grid two">
        <label>{locale === "cn" ? "语言偏好" : "Preferred language"}
          <select name="languagePreference" defaultValue={locale === "cn" ? "中文" : "Bilingual"}><option value="English">{locale === "cn" ? "英文" : "English"}</option><option value="中文">中文</option><option value="Bilingual">{locale === "cn" ? "中英双语" : "Bilingual"}</option></select>
        </label>
        <label>{locale === "cn" ? "如何得知活动" : "How did you hear about us?"}
          <select name="referralSource" defaultValue=""><option value="">{locale === "cn" ? "请选择" : "Select"}</option><option value="Friend or colleague">{locale === "cn" ? "朋友或同事" : "Friend or colleague"}</option><option value="WeChat">微信</option><option value="CAUCC">CAUCC</option><option value="Partner organization">{locale === "cn" ? "合作机构" : "Partner organization"}</option><option value="Social media">{locale === "cn" ? "社交媒体" : "Social media"}</option><option value="Other">{locale === "cn" ? "其他" : "Other"}</option></select>
        </label>
      </div>
      <label>{locale === "cn" ? "无障碍需求或其他备注" : "Accessibility or other notes"}<textarea name="accessibilityNotes" rows={3} placeholder={locale === "cn" ? "选填" : "Optional"} /></label>

      <label className="forum-consent">
        <input type="checkbox" name="marketingOptIn" defaultChecked />
        <span>{locale === "cn" ? "接收 CAUCC 今后的活动与社区通知。" : "Send me future CAUCC event and community updates."}</span>
      </label>

      {state.status === "error" && <p className="forum-form-error" role="alert">{state.message}</p>}
      <button className="forum-button" disabled={pending}>{pending ? (locale === "cn" ? "提交中…" : "Registering…") : (locale === "cn" ? "完成报名" : "Complete registration")}<ArrowRight size={17} /></button>
      <p className="forum-privacy">{locale === "cn" ? "您的信息仅用于活动管理及您选择接收的通知。" : "Your information is used only for event operations and the updates you select."}</p>
    </form>
  );
}
