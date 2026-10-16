"use client";

import { createCopy, type PageCopy } from "@/lib/page-copy";


import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarCheck2, CheckCircle2, MapPin } from "lucide-react";
import { forumRegistrationAction, type FormState } from "@/app/actions";

export function ForumRegistrationForm({locale = "en", copy = {}}: {locale?: "en" | "cn"; copy?: PageCopy}) {
  const copyText = createCopy(copy);
  const initialState: FormState = { status: "idle", message: "" };
  const [state, action, pending] = useActionState(forumRegistrationAction, initialState);

  if (state.status === "success") {
    return (
      <div className="forum-success" role="status">
        <span><CheckCircle2 size={34} /></span>
        <p className="forum-kicker">{locale === "cn" ? copyText("报名成功") : copyText("Registration confirmed")}</p>
        <h2>{locale === "cn" ? <>{copyText("您的席位已确认。")}<br /><em>{copyText("期待与您见面。")}</em></> : <>{copyText("We saved your seat.")}<br /><em>{copyText("See you there.")}</em></>}</h2>
        <p>{state.message}</p>
        <div className="forum-confirmation-details">
          <div><CalendarCheck2 size={18} /><span><strong>{locale === "cn" ? copyText("2026年9月7日") : copyText("September 7, 2026")}</strong>{locale === "cn" ? copyText("下午 2:00–5:00") : copyText("2:00–5:00 PM")}</span></div>
          <div><MapPin size={18} /><span><strong>{copyText("7361 Calhoun Place")}</strong>{copyText("Rockville, MD 20855")}</span></div>
        </div>
        <Link className="forum-button" href={locale === "cn" ? "/cn/member" : "/member"}>{locale === "cn" ? copyText("进入会员中心") : copyText("Open member home")} <ArrowRight size={17} /></Link>
      </div>
    );
  }

  return (
    <form action={action} className="forum-form">
      <input type="hidden" name="locale" value={locale} />
      <div className="forum-form-heading">
        <p className="forum-kicker">{locale === "cn" ? copyText("报名登记") : copyText("Registration")}</p>
        <h2>{locale === "cn" ? copyText("活动报名") : copyText("Event registration")}</h2>
        <p>{locale === "cn" ? copyText("本次活动免费参加，请每位参会者单独填写。") : copyText("Registration is complimentary. Please submit one form per attendee.")}</p>
      </div>

      <div className="forum-form-grid two">
        <label>{locale === "cn" ? copyText("名字") : copyText("First name")}<input name="firstName" autoComplete="given-name" required /></label>
        <label>{locale === "cn" ? copyText("姓氏") : copyText("Last name")}<input name="lastName" autoComplete="family-name" required /></label>
      </div>
      <div className="forum-form-grid two">
        <label>{locale === "cn" ? copyText("电子邮箱") : copyText("Email")}<input name="email" type="email" autoComplete="email" required /></label>
        <label>{locale === "cn" ? copyText("手机号码") : copyText("Mobile phone")}<input name="phone" type="tel" autoComplete="tel" required /></label>
      </div>
      <div className="forum-form-grid two">
        <label>{locale === "cn" ? copyText("公司／机构") : copyText("Organization")}<input name="organization" autoComplete="organization" /></label>
        <label>{locale === "cn" ? copyText("职位") : copyText("Title or role")}<input name="jobTitle" autoComplete="organization-title" /></label>
      </div>
      <div className="forum-form-grid two">
        <label>{locale === "cn" ? copyText("语言偏好") : copyText("Preferred language")}
          <select name="languagePreference" defaultValue={locale === "cn" ? "中文" : "Bilingual"}><option value="English">{locale === "cn" ? copyText("英文") : copyText("English")}</option><option value="中文">{copyText("中文")}</option><option value="Bilingual">{locale === "cn" ? copyText("中英双语") : copyText("Bilingual")}</option></select>
        </label>
        <label>{locale === "cn" ? copyText("如何得知活动") : copyText("How did you hear about us?")}
          <select name="referralSource" defaultValue=""><option value="">{locale === "cn" ? copyText("请选择") : copyText("Select")}</option><option value="Friend or colleague">{locale === "cn" ? copyText("朋友或同事") : copyText("Friend or colleague")}</option><option value="WeChat">{copyText("微信")}</option><option value="WLHL Club">{copyText("WLHL 俱乐部")}</option><option value="Partner organization">{locale === "cn" ? copyText("合作机构") : copyText("Partner organization")}</option><option value="Social media">{locale === "cn" ? copyText("社交媒体") : copyText("Social media")}</option><option value="Other">{locale === "cn" ? copyText("其他") : copyText("Other")}</option></select>
        </label>
      </div>
      <label>{locale === "cn" ? copyText("无障碍需求或其他备注") : copyText("Accessibility or other notes")}<textarea name="accessibilityNotes" rows={3} placeholder={locale === "cn" ? copyText("选填") : copyText("Optional")} /></label>

      <label className="forum-consent">
        <input type="checkbox" name="marketingOptIn" defaultChecked />
        <span>{locale === "cn" ? copyText("接收俱乐部今后的活动与社区通知。") : copyText("Send me future club event and community updates.")}</span>
      </label>

      {state.status === "error" && <p className="forum-form-error" role="alert">{state.message}</p>}
      <button className="forum-button" disabled={pending}>{pending ? (locale === "cn" ? copyText("提交中…") : copyText("Registering…")) : (locale === "cn" ? copyText("完成报名") : copyText("Complete registration"))}<ArrowRight size={17} /></button>
      <p><Link href={locale === "cn" ? "/cn/member" : "/member"}>{locale === "cn" ? "已有会员账户？请先登录后再报名。" : "Already have a member account? Sign in before registering."}</Link></p>
      <p className="forum-privacy">{locale === "cn" ? copyText("您的信息仅用于活动管理及您选择接收的通知。") : copyText("Your information is used only for event operations and the updates you select.")}</p>
    </form>
  );
}
