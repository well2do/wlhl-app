import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { adminLoginAction } from "@/app/actions";
import { Brand } from "@/components/brand";
import { isAdmin } from "@/lib/auth";

export const metadata = { title: "Club Administration" };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; view?: string }> }) {
  const params = await searchParams;
  const approvals = params.view === "approvals";
  const errors: Record<string, string> = {
    "Incorrect password": "网站管理员密码不正确。请使用网站专用密码；店铺后台密码不能在这里使用。",
    "Too many attempts. Try again in 15 minutes.": "登录尝试次数过多，请等待 15 分钟后重试。",
    "Admin access has not been configured": "网站管理员登录尚未配置，请联系网站负责人。",
  };
  if (await isAdmin()) redirect(approvals ? "/admin?view=approvals" : "/admin");
  return (
    <main className="access-page admin-access-page">
      <div className="access-brand"><Brand /></div>
      <section className="access-card admin-login-card">
        <span className="access-icon"><LockKeyhole size={25} /></span>
        <p className="eyebrow">Private workspace</p><h1>{approvals ? "网站会员审核" : "Club administration"}</h1><p>{approvals ? "请使用网站管理员密码登录。店铺后台账号与网站管理员账号分开管理。登录后将直接进入待审核会员列表。" : "Manage members, events, attendance, announcements, products, and expert profiles."}</p>
        <p>这里仅需网站管理员密码，无需输入账号。<Link href="/wlhl-application/index.html#/login">店铺、订单和文章管理请使用店铺后台登录。</Link></p>
        <form action={adminLoginAction} className="stack-form">{approvals && <input type="hidden" name="view" value="approvals" />}<label>{approvals ? "网站管理员密码" : "Admin password"}<input type="password" name="password" autoComplete="current-password" required /></label>{params.error && <p className="form-error">{errors[params.error] || params.error}</p>}<button className="button button-dark button-full">{approvals ? "登录并审核会员" : "Sign in"}</button></form>
        <Link className="back-link" href="/"><ArrowLeft size={15} />Back to club website</Link>
      </section>
    </main>
  );
}
