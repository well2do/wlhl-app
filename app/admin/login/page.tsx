import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { adminLoginAction } from "@/app/actions";
import { Brand } from "@/components/brand";
import { isAdmin } from "@/lib/auth";

export const metadata = { title: "Club Administration" };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdmin()) redirect("/admin");
  const params = await searchParams;
  return (
    <main className="access-page admin-access-page">
      <div className="access-brand"><Brand /></div>
      <section className="access-card admin-login-card">
        <span className="access-icon"><LockKeyhole size={25} /></span>
        <p className="eyebrow">Private workspace</p><h1>Club administration</h1><p>Manage members, events, attendance, announcements, and products.</p>
        <form action={adminLoginAction} className="stack-form"><label>Admin password<input type="password" name="password" autoComplete="current-password" required /></label>{params.error && <p className="form-error">{params.error}</p>}<button className="button button-dark button-full">Sign in</button></form>
        <Link className="back-link" href="/"><ArrowLeft size={15} />Back to club website</Link>
      </section>
    </main>
  );
}
