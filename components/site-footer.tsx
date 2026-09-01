import Link from "next/link";
import { Brand } from "./brand";

export function SiteFooter({ locale = "en" }: { locale?: "en" | "cn" }) {
  const email = process.env.NEXT_PUBLIC_CLUB_EMAIL;
  const phone = process.env.NEXT_PUBLIC_CLUB_PHONE;
  const isChinese = locale === "cn";
  const prefix = isChinese ? "/cn" : "";
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <Brand inverse href={isChinese ? "/cn" : "/"} />
          <p>{isChinese ? "华盛顿地区温暖友善的健康生活社区，让每个年龄阶段都能更健康、更有活力、更有连接。" : "A welcoming Washington, D.C. community making healthy, connected living easier at every age."}</p>
        </div>
        <div>
          <p className="footer-label">{isChinese ? "探索" : "Explore"}</p>
          <Link href={`${prefix}/events`}>{isChinese ? "活动" : "Events"}</Link>
          <Link href={`${prefix}/join`}>{isChinese ? "会员申请" : "Membership"}</Link>
          <Link href={`${prefix}/#shop`}>{isChinese ? "健康产品" : "Wellness shop"}</Link>
        </div>
        <div>
          <p className="footer-label">{isChinese ? "联系我们" : "Connect"}</p>
          {email && <a href={`mailto:${email}`}>{email}</a>}
          {phone && <a href={`tel:${phone.replace(/\D/g, "")}`}>{phone}</a>}
          {!email && !phone && <span className="footer-pending">{isChinese ? "联系信息即将公布" : "Contact details coming soon"}</span>}
          <Link href={isChinese ? "/cn/member" : "/member"}>{isChinese ? "会员中心" : "Member portal"}</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Washington Longevity Healthy Life Club</span>
        <Link href="/admin/login">{isChinese ? "俱乐部管理" : "Club administration"}</Link>
      </div>
    </footer>
  );
}
