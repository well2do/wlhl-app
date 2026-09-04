"use server";

import webpush from "web-push";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  clearAdminSession,
  clearMemberSession,
  createAdminSession,
  createMemberSession,
  getMemberSession,
  isAdmin,
} from "@/lib/auth";
import { execute } from "@/lib/db";

export type FormState = { status: "idle" | "success" | "error"; message: string };

const text = (formData: FormData, key: string) => String(formData.get(key) || "").trim();
const checked = (formData: FormData, key: string) => (formData.get(key) ? 1 : 0);

const memberSchema = z.object({
  firstName: z.string().min(2, "Please enter your first name."),
  lastName: z.string().min(2, "Please enter your last name."),
  email: z.email("Please enter a valid email address."),
  phone: z.string().min(7, "Please enter a valid phone number."),
  birthday: z.string().optional(),
  interests: z.string().optional(),
});

export async function joinClubAction(_state: FormState, formData: FormData): Promise<FormState> {
  const cn = text(formData, "locale") === "cn";
  const parsed = memberSchema.safeParse({
    firstName: text(formData, "firstName"),
    lastName: text(formData, "lastName"),
    email: text(formData, "email").toLowerCase(),
    phone: text(formData, "phone"),
    birthday: text(formData, "birthday"),
    interests: formData.getAll("interests").join(", "),
  });

  if (!parsed.success) {
    return { status: "error", message: cn ? "请检查并完整填写申请信息。" : parsed.error.issues[0]?.message || "Please review your information." };
  }

  try {
    const id = crypto.randomUUID();
    const data = parsed.data;
    await execute(
      `INSERT INTO members
       (id, first_name, last_name, email, phone, birthday, interests, membership_status,
        joined_at, email_opt_in, sms_opt_in, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, '')`,
      [
        id,
        data.firstName,
        data.lastName,
        data.email,
        data.phone,
        data.birthday || null,
        data.interests || "",
        new Date().toISOString(),
        checked(formData, "emailOptIn"),
        checked(formData, "smsOptIn"),
      ],
    );
    await writeActivityLog({ memberId: id, activityType: "membership_application", description: "Submitted a CAUCC membership application.", actorType: "member" });
    await createMemberSession(id);
    revalidatePath("/");
    revalidatePath("/cn");
    revalidatePath("/admin");
    return { status: "success", message: cn ? `${data.firstName}，您的 CAUCC 会员申请已提交。` : `Welcome, ${data.firstName}! Your CAUCC membership application is in.` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.toLowerCase().includes("unique")) {
      return { status: "error", message: cn ? "该电子邮箱已经登记，请前往会员中心查看账户。" : "That email is already registered. Use Member access to view your account." };
    }
    return { status: "error", message: cn ? "暂时无法保存申请，请稍后重试。" : "We couldn't save your application. Please try again." };
  }
}

const forumRegistrationSchema = z.object({
  firstName: z.string().min(2, "Please enter your first name."),
  lastName: z.string().min(2, "Please enter your last name."),
  email: z.email("Please enter a valid email address."),
  phone: z.string().min(7, "Please enter a valid phone number."),
  organization: z.string().max(120).optional(),
  jobTitle: z.string().max(120).optional(),
  languagePreference: z.enum(["English", "中文", "Bilingual"]),
  accessibilityNotes: z.string().max(500).optional(),
  referralSource: z.string().max(120).optional(),
});

async function writeActivityLog(input: {
  memberId?: string | null;
  eventId?: string | null;
  activityType: string;
  description: string;
  actorType: "member" | "admin" | "system";
  metadata?: Record<string, string | number | boolean | null>;
}) {
  await execute(
    `INSERT INTO activity_logs
     (id, member_id, event_id, activity_type, description, actor_type, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      crypto.randomUUID(), input.memberId || null, input.eventId || null,
      input.activityType, input.description, input.actorType,
      JSON.stringify(input.metadata || {}), new Date().toISOString(),
    ],
  );
}

export async function forumRegistrationAction(_state: FormState, formData: FormData): Promise<FormState> {
  const cn = text(formData, "locale") === "cn";
  const parsed = forumRegistrationSchema.safeParse({
    firstName: text(formData, "firstName"),
    lastName: text(formData, "lastName"),
    email: text(formData, "email").toLowerCase(),
    phone: text(formData, "phone"),
    organization: text(formData, "organization"),
    jobTitle: text(formData, "jobTitle"),
    languagePreference: text(formData, "languagePreference") || "Bilingual",
    accessibilityNotes: text(formData, "accessibilityNotes"),
    referralSource: text(formData, "referralSource"),
  });

  if (!parsed.success) {
    return { status: "error", message: cn ? "请检查并完整填写报名信息。" : parsed.error.issues[0]?.message || "Please review your registration." };
  }

  const eventId = "forum-2026-09-07";
  const data = parsed.data;
  const now = new Date().toISOString();
  const marketingOptIn = checked(formData, "marketingOptIn");

  try {
    const existing = await execute("SELECT id FROM members WHERE email = ? LIMIT 1", [data.email]);
    const memberId = existing.rows[0]?.id ? String(existing.rows[0].id) : crypto.randomUUID();

    if (existing.rows.length === 0) {
      await execute(
        `INSERT INTO members
         (id, first_name, last_name, email, phone, birthday, interests, membership_tier,
          membership_status, joined_at, email_opt_in, sms_opt_in, notes)
         VALUES (?, ?, ?, ?, ?, NULL, ?, 'Event Guest', 'pending', ?, ?, 0, ?)`,
        [
          memberId, data.firstName, data.lastName, data.email, data.phone,
          "AI, Healthy aging, Wealth legacy", now, marketingOptIn,
          `Registered through the September 7, 2026 forum page. Organization: ${data.organization || "Not provided"}.`,
        ],
      );
    } else {
      await execute(
        `UPDATE members SET first_name = ?, last_name = ?, phone = ?,
         email_opt_in = CASE WHEN ? = 1 THEN 1 ELSE email_opt_in END WHERE id = ?`,
        [data.firstName, data.lastName, data.phone, marketingOptIn, memberId],
      );
    }

    await execute(
      `INSERT INTO event_registrations
       (id, event_id, member_id, first_name, last_name, email, phone, organization,
        job_title, language_preference, accessibility_notes, referral_source,
        marketing_opt_in, status, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'registered', 'public_event_page', ?, ?)
       ON CONFLICT(event_id, email) DO UPDATE SET
         member_id = excluded.member_id, first_name = excluded.first_name,
         last_name = excluded.last_name, phone = excluded.phone,
         organization = excluded.organization, job_title = excluded.job_title,
         language_preference = excluded.language_preference,
         accessibility_notes = excluded.accessibility_notes,
         referral_source = excluded.referral_source,
         marketing_opt_in = excluded.marketing_opt_in, status = 'registered',
         updated_at = excluded.updated_at`,
      [
        crypto.randomUUID(), eventId, memberId, data.firstName, data.lastName,
        data.email, data.phone, data.organization || "", data.jobTitle || "",
        data.languagePreference, data.accessibilityNotes || "", data.referralSource || "",
        marketingOptIn, now, now,
      ],
    );

    await execute(
      `INSERT INTO attendance (id, member_id, event_id, status, checked_in_at)
       VALUES (?, ?, ?, 'registered', NULL)
       ON CONFLICT(member_id, event_id) DO UPDATE SET status = 'registered'`,
      [crypto.randomUUID(), memberId, eventId],
    );

    await writeActivityLog({
      memberId,
      eventId,
      activityType: "event_registration",
      description: `Registered for the September 7 AI, Health & Wealth Legacy Forum.`,
      actorType: "member",
      metadata: { source: "public_event_page", language: data.languagePreference },
    });
    await createMemberSession(memberId);
    revalidatePath("/events/ai-health-wealth-forum");
    revalidatePath("/cn/events/ai-health-wealth-forum");
    revalidatePath("/admin");
    revalidatePath("/member");
    return { status: "success", message: cn ? `${data.firstName}，您已成功报名 9 月 7 日的活动。` : `Thank you, ${data.firstName}. Your seat is registered for September 7.` };
  } catch {
    return { status: "error", message: cn ? "暂时无法完成报名，请重试或联系活动负责人。" : "We couldn't complete your registration. Please try again or contact an organizer." };
  }
}

export async function memberLoginAction(formData: FormData) {
  const returnTo = text(formData, "returnTo") === "/cn/member" ? "/cn/member" : "/member";
  const email = text(formData, "email").toLowerCase();
  const phoneLastFour = text(formData, "phoneLastFour").replace(/\D/g, "");
  const result = await execute("SELECT id, phone FROM members WHERE email = ? LIMIT 1", [email]);
  const member = result.rows[0];
  const storedLastFour = String(member?.phone || "").replace(/\D/g, "").slice(-4);

  if (!member || phoneLastFour.length !== 4 || phoneLastFour !== storedLastFour) {
    redirect(`${returnTo}?error=${returnTo.startsWith("/cn") ? encodeURIComponent("无法匹配您填写的信息") : "We+couldn%27t+match+those+details"}`);
  }
  await createMemberSession(String(member.id));
  redirect(returnTo);
}

export async function memberLogoutAction(formData: FormData) {
  const returnTo = text(formData, "returnTo") === "/cn" ? "/cn" : "/";
  await clearMemberSession();
  redirect(returnTo);
}

export async function registerForEventAction(formData: FormData) {
  const memberId = await getMemberSession();
  const eventId = text(formData, "eventId");
  if (!memberId || !eventId) return;
  const member = await execute("SELECT membership_status FROM members WHERE id = ? LIMIT 1", [memberId]);
  if (member.rows[0]?.membership_status !== "active") return;
  await execute(
    `INSERT INTO attendance (id, member_id, event_id, status, checked_in_at)
     VALUES (?, ?, ?, 'registered', NULL)
     ON CONFLICT(member_id, event_id) DO UPDATE SET status = 'registered'`,
    [crypto.randomUUID(), memberId, eventId],
  );
  await writeActivityLog({ memberId, eventId, activityType: "event_registration", description: "Reserved a place through the member portal.", actorType: "member", metadata: { source: "member_portal" } });
  revalidatePath("/member");
  revalidatePath("/cn/member");
  revalidatePath("/events");
  revalidatePath("/cn/events");
}

export async function adminLoginAction(formData: FormData) {
  const password = text(formData, "password");
  if (process.env.NODE_ENV === "production" && !process.env.ADMIN_PASSWORD) {
    redirect("/admin/login?error=Admin+access+has+not+been+configured");
  }
  const expected = process.env.ADMIN_PASSWORD || "wlhl-admin";
  if (password !== expected) redirect("/admin/login?error=Incorrect+password");
  await createAdminSession();
  redirect("/admin");
}

export async function adminLogoutAction() {
  await clearAdminSession();
  redirect("/");
}

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

async function sendPushNotification(title: string, body: string) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;

  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:hello@wlhlclub.org", publicKey, privateKey);
  const result = await execute("SELECT endpoint, p256dh, auth FROM push_subscriptions");
  await Promise.allSettled(
    result.rows.map(async (row) => {
      try {
        await webpush.sendNotification(
          { endpoint: String(row.endpoint), keys: { p256dh: String(row.p256dh), auth: String(row.auth) } },
          JSON.stringify({ title, body, url: "/" }),
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) await execute("DELETE FROM push_subscriptions WHERE endpoint = ?", [String(row.endpoint)]);
      }
    }),
  );
}

export async function createAnnouncementAction(formData: FormData) {
  await requireAdmin();
  const title = text(formData, "title");
  const message = text(formData, "message");
  const kind = text(formData, "kind") || "community";
  if (title.length < 3 || message.length < 8) return;
  await execute("INSERT INTO announcements (id, title, message, kind, published_at, featured) VALUES (?, ?, ?, ?, ?, ?)", [
    crypto.randomUUID(), title, message, kind, new Date().toISOString(), checked(formData, "featured"),
  ]);
  await writeActivityLog({ activityType: "announcement_published", description: `Published announcement: ${title}`, actorType: "admin" });
  await sendPushNotification(title, message);
  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin?view=announcements&saved=Announcement+published");
}

export async function createEventAction(formData: FormData) {
  await requireAdmin();
  const eventDate = text(formData, "eventDate");
  const eventId = crypto.randomUUID();
  await execute("INSERT INTO events (id, title, description, event_date, end_date, location, category, capacity, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'upcoming')", [
    eventId,
    text(formData, "title"),
    text(formData, "description"),
    new Date(eventDate).toISOString(),
    null,
    text(formData, "location"),
    text(formData, "category"),
    Math.max(1, Number(text(formData, "capacity")) || 30),
  ]);
  await writeActivityLog({ eventId, activityType: "event_created", description: `Created event: ${text(formData, "title")}`, actorType: "admin" });
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/admin");
  redirect("/admin?view=events&saved=Event+created");
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();
  const product = readProductForm(formData);
  await execute("INSERT INTO products (id, name, description, price, category, badge, active) VALUES (?, ?, ?, ?, ?, ?, 1)", [
    crypto.randomUUID(),
    product.name,
    product.description,
    product.price,
    product.category,
    product.badge,
  ]);
  await writeActivityLog({ activityType: "product_created", description: `Added product: ${product.name}`, actorType: "admin" });
  revalidateProductPages();
  productAdminRedirect("saved", "Product added");
}

function productAdminRedirect(kind: "saved" | "error", message: string, productId?: string): never {
  const params = new URLSearchParams({ view: "products", [kind]: message });
  if (productId) params.set("editProduct", productId);
  redirect(`/admin?${params.toString()}`);
}

function readProductForm(formData: FormData, productId?: string) {
  const name = text(formData, "name");
  const description = text(formData, "description");
  const priceText = text(formData, "price");
  const price = Number(priceText);
  const category = text(formData, "category");
  const badge = text(formData, "badge");

  if (
    name.length < 2 || name.length > 120
    || description.length < 8 || description.length > 1000
    || priceText.length === 0 || !Number.isFinite(price) || price < 0
    || category.length === 0 || category.length > 80
    || badge.length > 80
  ) {
    productAdminRedirect("error", "Please complete the product fields.", productId);
  }

  return { name, description, price, category, badge };
}

function revalidateProductPages() {
  revalidatePath("/");
  revalidatePath("/cn");
  revalidatePath("/admin");
  revalidatePath("/admin/landing-page-editor");
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin();
  const productId = text(formData, "productId");
  if (!productId) productAdminRedirect("error", "Product not found.");
  const product = readProductForm(formData, productId);
  const existing = await execute("SELECT id FROM products WHERE id = ? LIMIT 1", [productId]);
  if (existing.rows.length === 0) productAdminRedirect("error", "Product not found.");

  await execute(
    "UPDATE products SET name = ?, description = ?, price = ?, category = ?, badge = ? WHERE id = ?",
    [product.name, product.description, product.price, product.category, product.badge, productId],
  );
  await writeActivityLog({
    activityType: "product_updated",
    description: `Updated product: ${product.name}`,
    actorType: "admin",
    metadata: { productId },
  });
  revalidateProductPages();
  productAdminRedirect("saved", "Product updated");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const productId = text(formData, "productId");
  if (!productId) productAdminRedirect("error", "Product not found.");
  const existing = await execute("SELECT name FROM products WHERE id = ? LIMIT 1", [productId]);
  if (existing.rows.length === 0) productAdminRedirect("error", "Product not found.");
  const productName = String(existing.rows[0].name);

  await execute("DELETE FROM products WHERE id = ?", [productId]);
  await writeActivityLog({
    activityType: "product_deleted",
    description: `Deleted product: ${productName}`,
    actorType: "admin",
    metadata: { productId },
  });
  revalidateProductPages();
  productAdminRedirect("saved", "Product deleted");
}

export async function updateMemberStatusAction(formData: FormData) {
  await requireAdmin();
  const status = text(formData, "status");
  if (!["pending", "active", "paused"].includes(status)) return;
  const memberId = text(formData, "memberId");
  await execute("UPDATE members SET membership_status = ? WHERE id = ?", [status, memberId]);
  await writeActivityLog({ memberId, activityType: "membership_status_updated", description: `Membership status changed to ${status}.`, actorType: "admin", metadata: { status } });
  revalidatePath("/admin");
  redirect("/admin?view=members&saved=Member+updated");
}

export async function recordAttendanceAction(formData: FormData) {
  await requireAdmin();
  const status = text(formData, "status");
  const checkedIn = status === "attended" || status === "completed" ? new Date().toISOString() : null;
  const memberId = text(formData, "memberId");
  const eventId = text(formData, "eventId");
  await execute(
    `INSERT INTO attendance (id, member_id, event_id, status, checked_in_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(member_id, event_id) DO UPDATE SET status = excluded.status, checked_in_at = excluded.checked_in_at`,
    [crypto.randomUUID(), memberId, eventId, status, checkedIn],
  );
  await execute("UPDATE event_registrations SET status = ?, updated_at = ? WHERE member_id = ? AND event_id = ?", [status, new Date().toISOString(), memberId, eventId]);
  await writeActivityLog({ memberId, eventId, activityType: "attendance_updated", description: `Event attendance changed to ${status}.`, actorType: "admin", metadata: { status } });
  revalidatePath("/admin");
  revalidatePath("/member");
  redirect("/admin?view=attendance&saved=Attendance+recorded");
}

export async function toggleProductAction(formData: FormData) {
  await requireAdmin();
  const productId = text(formData, "productId");
  if (!productId) productAdminRedirect("error", "Product not found.");
  await execute("UPDATE products SET active = CASE active WHEN 1 THEN 0 ELSE 1 END WHERE id = ?", [productId]);
  await writeActivityLog({ activityType: "product_visibility_updated", description: "Changed product website visibility.", actorType: "admin", metadata: { productId } });
  revalidateProductPages();
}

function expertAdminRedirect(kind: "saved" | "error", message: string, expertId?: string): never {
  const params = new URLSearchParams({ view: "experts", [kind]: message });
  if (expertId) params.set("editExpert", expertId);
  redirect(`/admin?${params.toString()}`);
}

function readExpertForm(formData: FormData, expertId?: string) {
  const nameEn = text(formData, "nameEn");
  const nameCn = text(formData, "nameCn");
  const roleEn = text(formData, "roleEn");
  const roleCn = text(formData, "roleCn");
  const biographyEn = text(formData, "biographyEn");
  const biographyCn = text(formData, "biographyCn");
  const profileUrl = text(formData, "profileUrl");
  const sortOrderText = text(formData, "sortOrder");
  const sortOrder = Number(sortOrderText);

  let profileUrlIsValid = true;
  if (profileUrl) {
    try {
      const parsedUrl = new URL(profileUrl);
      profileUrlIsValid = parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
      profileUrlIsValid = false;
    }
  }

  if (
    nameEn.length < 2 || nameEn.length > 120
    || nameCn.length < 2 || nameCn.length > 120
    || roleEn.length < 2 || roleEn.length > 200
    || roleCn.length < 2 || roleCn.length > 200
    || biographyEn.length < 8 || biographyEn.length > 8000
    || biographyCn.length < 8 || biographyCn.length > 8000
    || !profileUrlIsValid || profileUrl.length > 500
    || sortOrderText.length === 0 || !Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000
  ) {
    expertAdminRedirect("error", "Please complete the expert profile fields.", expertId);
  }

  return { nameEn, nameCn, roleEn, roleCn, biographyEn, biographyCn, profileUrl, sortOrder };
}

function revalidateExpertPages() {
  revalidatePath("/about");
  revalidatePath("/cn/about");
  revalidatePath("/admin");
}

export async function createExpertAction(formData: FormData) {
  await requireAdmin();
  const expert = readExpertForm(formData);
  const expertId = crypto.randomUUID();
  const now = new Date().toISOString();
  await execute(
    `INSERT INTO expert_profiles
     (id, name_en, name_cn, role_en, role_cn, biography_en, biography_cn,
      profile_url, sort_order, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      expertId, expert.nameEn, expert.nameCn, expert.roleEn, expert.roleCn,
      expert.biographyEn, expert.biographyCn, expert.profileUrl, expert.sortOrder, now, now,
    ],
  );
  await writeActivityLog({
    activityType: "expert_created",
    description: `Added expert profile: ${expert.nameEn}`,
    actorType: "admin",
    metadata: { expertId },
  });
  revalidateExpertPages();
  expertAdminRedirect("saved", "Expert profile added");
}

export async function updateExpertAction(formData: FormData) {
  await requireAdmin();
  const expertId = text(formData, "expertId");
  if (!expertId) expertAdminRedirect("error", "Expert profile not found.");
  const expert = readExpertForm(formData, expertId);
  const existing = await execute("SELECT id FROM expert_profiles WHERE id = ? LIMIT 1", [expertId]);
  if (existing.rows.length === 0) expertAdminRedirect("error", "Expert profile not found.");

  await execute(
    `UPDATE expert_profiles SET name_en = ?, name_cn = ?, role_en = ?, role_cn = ?,
     biography_en = ?, biography_cn = ?, profile_url = ?, sort_order = ?, updated_at = ?
     WHERE id = ?`,
    [
      expert.nameEn, expert.nameCn, expert.roleEn, expert.roleCn,
      expert.biographyEn, expert.biographyCn, expert.profileUrl,
      expert.sortOrder, new Date().toISOString(), expertId,
    ],
  );
  await writeActivityLog({
    activityType: "expert_updated",
    description: `Updated expert profile: ${expert.nameEn}`,
    actorType: "admin",
    metadata: { expertId },
  });
  revalidateExpertPages();
  expertAdminRedirect("saved", "Expert profile updated");
}

export async function toggleExpertAction(formData: FormData) {
  await requireAdmin();
  const expertId = text(formData, "expertId");
  if (!expertId) expertAdminRedirect("error", "Expert profile not found.");
  await execute(
    "UPDATE expert_profiles SET active = CASE active WHEN 1 THEN 0 ELSE 1 END, updated_at = ? WHERE id = ?",
    [new Date().toISOString(), expertId],
  );
  await writeActivityLog({
    activityType: "expert_visibility_updated",
    description: "Changed expert profile website visibility.",
    actorType: "admin",
    metadata: { expertId },
  });
  revalidateExpertPages();
}
