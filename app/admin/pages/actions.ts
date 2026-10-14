"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { execute } from "@/lib/db";
import { isEditablePage, pageCopyFields, validatePageCopy, type PageCopy } from "@/lib/page-copy";

export async function updatePageCopyAction(formData: FormData) {
  await requireAdmin();
  const page = String(formData.get("page") ?? "");
  const locale = String(formData.get("locale") ?? "");
  if (!isEditablePage(page) || (locale !== "en" && locale !== "cn")) redirect("/admin/pages?error=Invalid+page+or+language");
  const location = `/admin/pages?page=${page}&locale=${locale}`;
  const revision = Number(formData.get("revision"));
  if (!formData.has("revision") || !Number.isSafeInteger(revision) || revision < 0) redirect(`${location}&error=Invalid+version`);
  const copy: PageCopy = {};
  for (const [index, original] of pageCopyFields(page, locale).entries()) {
    const value = formData.get(`copy:${index}`);
    if (typeof value !== "string") redirect(`${location}&error=Please+submit+the+complete+form`);
    copy[original] = value;
  }
  try { validatePageCopy(page, locale, copy); }
  catch (error) { redirect(`${location}&error=${encodeURIComponent(error instanceof Error ? error.message : "Invalid content")}`); }

  // Compare versions in the write itself so a stale editor cannot overwrite newer changes.
  const result = await execute(
    `INSERT INTO page_content (page, locale, content_json, revision, updated_at)
     SELECT ?, ?, ?, 1, ? WHERE ? = 0
     ON CONFLICT(page, locale) DO NOTHING`,
    [page, locale, JSON.stringify(copy), new Date().toISOString(), revision],
  );
  const updated = revision > 0 ? await execute(
    `UPDATE page_content SET content_json = ?, revision = revision + 1, updated_at = ?
     WHERE page = ? AND locale = ? AND revision = ?`,
    [JSON.stringify(copy), new Date().toISOString(), page, locale, revision],
  ) : result;
  if (updated.rowsAffected !== 1) redirect(`${location}&error=This+page+changed+while+you+were+editing.+Reload+and+try+again.`);
  await execute(
    `INSERT INTO activity_logs (id, activity_type, description, actor_type, metadata, created_at)
     VALUES (?, 'page_content_updated', ?, 'admin', ?, ?)`,
    [crypto.randomUUID(), `Updated ${locale} ${page} page content.`, JSON.stringify({ page, locale }), new Date().toISOString()],
  );
  revalidatePath("/", "layout");
  redirect(`${location}&saved=Page+content+saved`);
}
