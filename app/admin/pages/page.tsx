import Link from "next/link";
import { ExternalLink, Save } from "lucide-react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { requireAdmin } from "@/lib/auth";
import { editablePages, isEditablePage, pageCopyFields, pageLabelsCn } from "@/lib/page-copy";
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
      <header className="admin-topbar"><div><p className="eyebrow">Website content</p><h1>全站网页内容管理</h1></div>
        <Link className="button button-outline button-small" href={preview} target="_blank" rel="noreferrer">View page <ExternalLink size={15} /></Link>
      </header>
      {params.saved && <p className="saved-toast" role="status">{params.saved}</p>}
      {params.error && <p className="editor-error-toast" role="alert">{params.error}</p>}
      <section className="admin-panel">
        <div className="admin-panel-heading"><div><h2>选择要修改的页面</h2><p>系统管理员可以修改全站网页及所有商户的活动。中英文分别保存。</p></div></div>
        <nav className="page-editor-links" aria-label="Website pages">
          <Link href={`/admin/landing-page-editor?locale=${locale}`}>首页、顶部导航和页脚</Link>
          {editablePages.map((item) => <Link key={item.id} href={`/admin/pages?page=${item.id}&locale=${locale}`} aria-current={page === item.id ? "page" : undefined}>{pageLabelsCn[item.id]}</Link>)}
        </nav>
      </section>
      <section className="admin-panel">
        <div className="admin-panel-heading"><div><h2>活动、文章、图片及其他内容</h2><p>页面标题和提示语在下方修改；具体内容使用对应入口。海报内的文字需要修改图片后重新上传。</p></div></div>
        <nav className="page-editor-links" aria-label="内容管理入口">
          <Link href="/shop-manager/events">所有商户的活动、活动网页文字及海报</Link>
          <Link href="/wlhl-application/index.html#/content/article">所有商户的文章及文章图片</Link>
          <Link href={`/admin/landing-page-editor?locale=${locale}#live-content`}>公告、商品及历史活动</Link>
          <Link href={`/admin/landing-page-editor?locale=${locale}#images`}>首页图片、标志及论坛海报</Link>
          <Link href="/admin?view=experts">专家介绍</Link>
        </nav>
        <p>跨商户文章使用店铺后台的系统管理员账号。普通商户和店铺账号仍按所属范围管理。</p>
      </section>
      <nav className="landing-locale-tabs" aria-label="Page language">
        <Link className={locale === "en" ? "active" : ""} href={`/admin/pages?page=${page}&locale=en`}>English</Link>
        <Link className={locale === "cn" ? "active" : ""} href={`/admin/pages?page=${page}&locale=cn`}>中文</Link>
      </nav>
      <section className="landing-editor-note"><div><strong>{pageLabelsCn[page]}</strong><p>找到原文字，修改输入框并保存，即可更新前台。这里只修改显示文字，不改变会员状态或收费记录。</p>
        {definition.records && <Link href={definition.records}>Manage related records or images →</Link>}
      </div></section>
      <form action={updatePageCopyAction} className="landing-copy-form page-copy-editor" key={`${page}-${locale}-${revision}`}>
        <input type="hidden" name="page" value={page} />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="revision" value={revision} />
        <div className="landing-form-heading"><h2>{locale === "cn" ? "中文页面内容" : "Page content"}</h2><button className="button button-dark"><Save size={16} />保存页面文字</button></div>
        <div className="landing-field-grid">
          {fields.map((original, index) => <label key={original} className={original.length > 100 ? "wide-field" : undefined}>
            <span>{original.length > 110 ? `${original.slice(0, 107)}…` : original}</span>
            <textarea name={`copy:${index}`} defaultValue={copy[original] ?? original} rows={original.length > 100 ? 4 : 2} maxLength={4000} />
          </label>)}
        </div>
        <div className="landing-form-footer"><button className="button button-dark"><Save size={16} />保存页面文字</button></div>
      </form>
    </main>
  </div>;
}
