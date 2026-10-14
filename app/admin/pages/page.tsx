import Link from "next/link";
import { ExternalLink, Save } from "lucide-react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { requireAdmin } from "@/lib/auth";
import { editablePages, isEditablePage, pageCopyFields } from "@/lib/page-copy";
import { getPageCopyRecord } from "@/lib/page-copy-store";
import { updatePageCopyAction } from "./actions";

export const metadata = { title: "Website page editor" };

export default async function PageEditor({ searchParams }: {
  searchParams: Promise<{ page?: string; locale?: string; error?: string; saved?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = isEditablePage(params.page ?? "") ? params.page as typeof editablePages[number]["id"] : "about";
  const locale = params.locale === "cn" ? "cn" : "en";
  const definition = editablePages.find((item) => item.id === page)!;
  const { copy, revision } = await getPageCopyRecord(page, locale);
  const fields = pageCopyFields(page, locale);
  const preview = `${locale === "cn" ? "/cn" : ""}${definition.path}`;

  return <div className="admin-shell">
    <AdminSidebar active="pages" />
    <main className="admin-main landing-editor-main">
      <header className="admin-topbar"><div><p className="eyebrow">Website content</p><h1>Website pages</h1></div>
        <Link className="button button-outline button-small" href={preview} target="_blank" rel="noreferrer">View page <ExternalLink size={15} /></Link>
      </header>
      {params.saved && <p className="saved-toast" role="status">{params.saved}</p>}
      {params.error && <p className="editor-error-toast" role="alert">{params.error}</p>}
      <section className="admin-panel">
        <div className="admin-panel-heading"><div><h2>Choose a page</h2><p>Administrators can publish page content. English and Chinese are saved separately.</p></div></div>
        <nav className="page-editor-links" aria-label="Website pages">
          <Link href={`/admin/landing-page-editor?locale=${locale}`}>Home, navigation and footer</Link>
          {editablePages.map((item) => <Link key={item.id} href={`/admin/pages?page=${item.id}&locale=${locale}`} aria-current={page === item.id ? "page" : undefined}>{item.label}</Link>)}
        </nav>
      </section>
      <nav className="landing-locale-tabs" aria-label="Page language">
        <Link className={locale === "en" ? "active" : ""} href={`/admin/pages?page=${page}&locale=en`}>English</Link>
        <Link className={locale === "cn" ? "active" : ""} href={`/admin/pages?page=${page}&locale=cn`}>中文</Link>
      </nav>
      <section className="landing-editor-note"><div><strong>{definition.label}</strong><p>Change the text below and save to publish. Labels identify the original text. Personal member data, event records, and product prices are managed in their own forms.</p>
        {definition.records && <Link href={definition.records}>Manage related records or images →</Link>}
      </div></section>
      <form action={updatePageCopyAction} className="landing-copy-form page-copy-editor" key={`${page}-${locale}-${revision}`}>
        <input type="hidden" name="page" value={page} />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="revision" value={revision} />
        <div className="landing-form-heading"><h2>{locale === "cn" ? "中文页面内容" : "Page content"}</h2><button className="button button-dark"><Save size={16} />Save page</button></div>
        <div className="landing-field-grid">
          {fields.map((original, index) => <label key={original} className={original.length > 100 ? "wide-field" : undefined}>
            <span>{original.length > 110 ? `${original.slice(0, 107)}…` : original}</span>
            <textarea name={`copy:${index}`} defaultValue={copy[original] ?? original} rows={original.length > 100 ? 4 : 2} maxLength={4000} />
          </label>)}
        </div>
        <div className="landing-form-footer"><button className="button button-dark"><Save size={16} />Save page content</button></div>
      </form>
    </main>
  </div>;
}
