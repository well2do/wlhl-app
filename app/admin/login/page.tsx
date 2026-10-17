import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { adminLoginAction } from "@/app/actions";
import { Brand } from "@/components/brand";
import { AdminLoginForm } from "@/components/admin-login-form";
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
        <p className="eyebrow">Private workspace</p><h1>{approvals ? "网站会员审核" : "Club administration"}</h1><p>{approvals ? "使用网站管理员密码登录后，将直接进入待审核会员列表。店铺后台的系统管理员也可以直接进入审核页面。" : "Manage members, events, attendance, announcements, products, and expert profiles."}</p>
        <p>系统管理员：先在店铺后台登录 admin，再点击“全站网页内容”，无需重复输入网站密码。普通商户和店铺账号没有全站管理权限。</p>
        <p>这里仅需网站管理员密码，无需输入账号。<Link href="/wlhl-application/index.html#/login">店铺、订单和文章管理请使用店铺后台登录。</Link></p>
        <AdminLoginForm action={adminLoginAction} approvals={approvals} error={params.error ? errors[params.error] || params.error : undefined} />
        <Link className="back-link" href="/"><ArrowLeft size={15} />Back to club website</Link>
      </section>
    </main>
  );
}
