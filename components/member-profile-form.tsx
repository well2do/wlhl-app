import { createCopy } from "@/lib/page-copy";
import { getPageCopy } from "@/lib/page-copy-store";
import { updateMemberProfileAction } from "@/app/member/profile-actions";
import type { Member } from "@/lib/types";

export async function MemberProfileForm({ member, locale }: { member: Member; locale: "en" | "cn" }) {
  const copyText = createCopy(await getPageCopy("member", locale));
  const cn = locale === "cn";
  return <section className="portal-panel" id="profile">
    <div className="panel-heading"><div><p className="eyebrow">{cn ? copyText("您的资料") : copyText("Your profile")}</p><h2>{cn ? copyText("个人资料与通知偏好") : copyText("Personal details and preferences")}</h2></div></div>
    <form action={updateMemberProfileAction} className="stack-form" style={{ padding: "0 24px 24px" }}>
      <input type="hidden" name="locale" value={locale} />
      <div className="form-row two-columns">
        <label>{cn ? copyText("名字") : copyText("First name")}<input name="firstName" defaultValue={member.first_name} required maxLength={100} autoComplete="given-name" /></label>
        <label>{cn ? copyText("姓氏") : copyText("Last name")}<input name="lastName" defaultValue={member.last_name} required maxLength={100} autoComplete="family-name" /></label>
      </div>
      <label>{cn ? copyText("兴趣") : copyText("Interests")}<input name="interests" defaultValue={member.interests} maxLength={500} /></label>
      <label className="check-line"><input type="checkbox" name="emailOptIn" defaultChecked={Boolean(member.email_opt_in)} />{cn ? copyText("接收电子邮件通知") : copyText("Receive email updates")}</label>
      <label className="check-line"><input type="checkbox" name="smsOptIn" defaultChecked={Boolean(member.sms_opt_in)} />{cn ? copyText("接收短信通知") : copyText("Receive SMS updates")}</label>
      <p>{cn ? copyText("如需更改登录邮箱、手机号码或会员方案，请联系俱乐部管理员。") : copyText("Contact a club administrator to change your sign-in email, phone number, or membership plan.")}</p>
      <button className="button button-dark">{cn ? copyText("保存个人资料") : copyText("Save my profile")}</button>
    </form>
  </section>;
}
