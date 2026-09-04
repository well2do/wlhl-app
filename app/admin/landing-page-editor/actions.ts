"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { execute } from "@/lib/db";
import {
  isAllowedLandingImageSlot,
  landingPageDefaults,
  type LandingPageContent,
  type LandingPageLocale,
} from "@/lib/landing-page-content";

const text = (formData: FormData, key: string) => String(formData.get(key) || "").trim();
const checked = (formData: FormData, key: string) => (formData.get(key) ? 1 : 0);

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

function editorRedirect(kind: "saved" | "error", message: string, locale?: LandingPageLocale): never {
  const localeQuery = locale === "cn" ? "locale=cn&" : "";
  redirect(`/admin/landing-page-editor?${localeQuery}${kind}=${encodeURIComponent(message)}`);
}

function revalidateLandingPage() {
  revalidatePath("/");
  revalidatePath("/cn");
  revalidatePath("/admin/landing-page-editor");
}

async function writeAdminLog(input: {
  activityType: string;
  description: string;
  eventId?: string;
  metadata?: Record<string, string | number>;
}) {
  await execute(
    `INSERT INTO activity_logs
     (id, member_id, event_id, activity_type, description, actor_type, metadata, created_at)
     VALUES (?, NULL, ?, ?, ?, 'admin', ?, ?)`,
    [
      crypto.randomUUID(),
      input.eventId || null,
      input.activityType,
      input.description,
      JSON.stringify(input.metadata || {}),
      new Date().toISOString(),
    ],
  );
}

export async function updateLandingPageContentAction(formData: FormData) {
  await requireAdmin();
  const locale: LandingPageLocale = text(formData, "locale") === "cn" ? "cn" : "en";
  const defaults = landingPageDefaults[locale];
  const content = { ...defaults } as LandingPageContent;

  for (const key of Object.keys(defaults) as (keyof LandingPageContent)[]) {
    const value = String(formData.get(key) ?? "").trim();
    if (value.length > 2000) editorRedirect("error", `${key} is too long.`, locale);
    content[key] = value;
  }

  const now = new Date().toISOString();
  await execute(
    `INSERT INTO landing_page_content (locale, content_json, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(locale) DO UPDATE SET content_json = excluded.content_json, updated_at = excluded.updated_at`,
    [locale, JSON.stringify(content), now],
  );
  await writeAdminLog({
    activityType: "landing_page_content_updated",
    description: `Updated the ${locale === "cn" ? "Chinese" : "English"} landing page text.`,
    metadata: { locale },
  });
  revalidateLandingPage();
  editorRedirect("saved", `${locale === "cn" ? "Chinese" : "English"} landing page text saved`, locale);
}

function validImageBytes(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png") return bytes.length >= 8 && bytes.slice(0, 8).every((byte, index) => byte === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index]);
  if (mimeType === "image/gif") return bytes.length >= 6 && new TextDecoder().decode(bytes.slice(0, 6)).match(/^GIF8[79]a$/) !== null;
  if (mimeType === "image/webp") {
    return bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF"
      && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}

export async function uploadLandingPageImageAction(formData: FormData) {
  await requireAdmin();
  const locale: LandingPageLocale = text(formData, "locale") === "cn" ? "cn" : "en";
  const slot = text(formData, "slot");
  const image = formData.get("image");
  if (!isAllowedLandingImageSlot(slot)) editorRedirect("error", "That image position is not valid.", locale);
  if (!(image instanceof File) || image.size === 0) editorRedirect("error", "Choose an image to upload.", locale);
  if (image.size > 4 * 1024 * 1024) editorRedirect("error", "Images must be 4 MB or smaller.", locale);

  const mimeType = image.type.toLowerCase();
  const bytes = new Uint8Array(await image.arrayBuffer());
  if (!validImageBytes(bytes, mimeType)) editorRedirect("error", "Use a valid JPG, PNG, WebP, or GIF image.", locale);

  const now = new Date().toISOString();
  await execute(
    `INSERT INTO landing_page_assets (slot, mime_type, file_name, data, updated_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(slot) DO UPDATE SET mime_type = excluded.mime_type, file_name = excluded.file_name,
       data = excluded.data, updated_at = excluded.updated_at`,
    [slot, mimeType, image.name.slice(0, 180), bytes, now],
  );
  await writeAdminLog({
    activityType: "landing_page_image_updated",
    description: `Uploaded a new landing page image for ${slot}.`,
    metadata: { slot, mimeType, bytes: image.size },
  });
  revalidateLandingPage();
  editorRedirect("saved", "Landing page image uploaded", locale);
}

export async function removeLandingPageImageAction(formData: FormData) {
  await requireAdmin();
  const locale: LandingPageLocale = text(formData, "locale") === "cn" ? "cn" : "en";
  const slot = text(formData, "slot");
  if (!isAllowedLandingImageSlot(slot)) editorRedirect("error", "That image position is not valid.", locale);
  await execute("DELETE FROM landing_page_assets WHERE slot = ?", [slot]);
  await writeAdminLog({
    activityType: "landing_page_image_removed",
    description: `Restored the default artwork for ${slot}.`,
    metadata: { slot },
  });
  revalidateLandingPage();
  editorRedirect("saved", "Default artwork restored", locale);
}

export async function updateLandingAnnouncementAction(formData: FormData) {
  await requireAdmin();
  const locale: LandingPageLocale = text(formData, "locale") === "cn" ? "cn" : "en";
  const announcementId = text(formData, "announcementId");
  const title = text(formData, "title");
  const message = text(formData, "message");
  const kind = text(formData, "kind");
  if (!announcementId || title.length < 3 || message.length < 8 || !["community", "event", "promotion"].includes(kind)) {
    editorRedirect("error", "Please complete the announcement fields.", locale);
  }
  if (locale === "cn") {
    await execute(
      "UPDATE announcements SET title_cn = ?, message_cn = ?, kind = ?, featured = ? WHERE id = ?",
      [title, message, kind, checked(formData, "featured"), announcementId],
    );
  } else {
    await execute(
      "UPDATE announcements SET title = ?, message = ?, kind = ?, featured = ? WHERE id = ?",
      [title, message, kind, checked(formData, "featured"), announcementId],
    );
  }
  await writeAdminLog({
    activityType: "landing_announcement_updated",
    description: `Updated landing page announcement: ${title}`,
    metadata: { announcementId, locale },
  });
  revalidateLandingPage();
  revalidatePath("/admin");
  editorRedirect("saved", `${locale === "cn" ? "Chinese " : ""}announcement updated`, locale);
}

export async function updateLandingEventAction(formData: FormData) {
  await requireAdmin();
  const locale: LandingPageLocale = text(formData, "locale") === "cn" ? "cn" : "en";
  const eventId = text(formData, "eventId");
  const title = text(formData, "title");
  const description = text(formData, "description");
  const location = text(formData, "location");
  const category = text(formData, "category");
  if (!eventId || title.length < 3 || description.length < 8 || location.length < 3 || !category) {
    editorRedirect("error", "Please complete the featured event fields.", locale);
  }
  if (locale === "cn") {
    await execute("UPDATE events SET title_cn = ?, description_cn = ?, location_cn = ?, category_cn = ? WHERE id = ?", [title, description, location, category, eventId]);
  } else {
    await execute("UPDATE events SET title = ?, description = ?, location = ?, category = ? WHERE id = ?", [title, description, location, category, eventId]);
  }
  await writeAdminLog({
    eventId,
    activityType: "landing_event_updated",
    description: `Updated ${locale === "cn" ? "Chinese " : ""}featured event: ${title}`,
    metadata: { locale },
  });
  revalidateLandingPage();
  revalidatePath("/events");
  revalidatePath("/cn/events");
  revalidatePath("/admin");
  editorRedirect("saved", `${locale === "cn" ? "Chinese " : ""}featured event updated`, locale);
}

export async function updateLandingProductAction(formData: FormData) {
  await requireAdmin();
  const locale: LandingPageLocale = text(formData, "locale") === "cn" ? "cn" : "en";
  const productId = text(formData, "productId");
  const name = text(formData, "name");
  const description = text(formData, "description");
  const price = Number(text(formData, "price"));
  const category = text(formData, "category");
  if (!productId || name.length < 2 || description.length < 8 || !Number.isFinite(price) || price < 0 || !category) {
    editorRedirect("error", "Please complete the product fields.", locale);
  }
  if (locale === "cn") {
    await execute(
      "UPDATE products SET name_cn = ?, description_cn = ?, price = ?, category_cn = ?, badge_cn = ? WHERE id = ?",
      [name, description, price, category, text(formData, "badge"), productId],
    );
  } else {
    await execute(
      "UPDATE products SET name = ?, description = ?, price = ?, category = ?, badge = ? WHERE id = ?",
      [name, description, price, category, text(formData, "badge"), productId],
    );
  }
  await writeAdminLog({
    activityType: "landing_product_updated",
    description: `Updated landing page product: ${name}`,
    metadata: { productId, locale },
  });
  revalidateLandingPage();
  revalidatePath("/admin");
  editorRedirect("saved", `${locale === "cn" ? "Chinese " : ""}product updated`, locale);
}
