import "server-only";
import { cache } from "react";
import { execute } from "./db";
import { validatePageCopy, type EditablePage, type PageCopy, type PageLocale } from "./page-copy";

export const getPageCopyRecord = cache(async (page: EditablePage, locale: PageLocale) => {
  const result = await execute("SELECT content_json, revision FROM page_content WHERE page = ? AND locale = ?", [page, locale]);
  const row = result.rows[0];
  let copy: PageCopy = {};
  if (row) {
    try { copy = validatePageCopy(page, locale, JSON.parse(String(row.content_json))); } catch { /* Use the published defaults if stored content is malformed. */ }
  }
  return { copy, revision: Number(row?.revision ?? 0) };
});

export async function getPageCopy(page: EditablePage, locale: PageLocale) {
  return (await getPageCopyRecord(page, locale)).copy;
}
