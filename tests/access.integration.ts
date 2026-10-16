import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient, type Client } from "@libsql/client";
import { issueSession } from "../lib/session-token";
import { editablePages, pageCopyFields } from "../lib/page-copy";

const origin = "http://localhost:3131";
const secret = "access-test-session-secret";
let directory: string;
let server: ChildProcess;
let db: Client;
let output = "";

const decode = (value: string) => value.replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

function formFrom(html: string, field: string, contains?: string) {
  const form = [...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)].map((match) => match[0])
    .find((value) => value.includes(`name="${field}"`) && (!contains || value.includes(contains)));
  assert.ok(form, `Missing form with ${field}`);
  const fields = new FormData();
  for (const match of form.matchAll(/<input\b[^>]*>/g)) {
    const tag = match[0];
    const name = tag.match(/name="([^"]+)"/)?.[1];
    if (!name || /type="(?:file|submit)"/.test(tag)) continue;
    if (/type="(?:radio|checkbox)"/.test(tag) && !/\bchecked(?:=|\s|\/|>)/.test(tag)) continue;
    fields.append(decode(name), decode(tag.match(/value="([^"]*)"/)?.[1] ?? (tag.includes('type="checkbox"') ? "on" : "")));
  }
  for (const match of form.matchAll(/<textarea\b[^>]*name="([^"]+)"[^>]*>([\s\S]*?)<\/textarea>/g)) fields.set(decode(match[1]), decode(match[2]));
  for (const match of form.matchAll(/<select\b[^>]*name="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)) {
    const options = [...match[2].matchAll(/<option([^>]*)>([\s\S]*?)<\/option>/g)];
    const option = options.find((item) => /\bselected/.test(item[1])) ?? options[0];
    if (option) fields.set(decode(match[1]), decode(option[1].match(/value="([^"]*)"/)?.[1] ?? option[2]));
  }
  return fields;
}

class BrowserSession {
  cookies = new Map<string, string>();
  get cookie() { return [...this.cookies].map(([key, value]) => `${key}=${value}`).join("; "); }
  async get(path: string) {
    const response = await fetch(`${origin}${path}`, { headers: { Cookie: this.cookie }, redirect: "manual" });
    assert.equal(response.status, 200, `${path}: ${response.status}`);
    return response.text();
  }
  async post(path: string, original: FormData, values: Record<string, string | Blob> = {}) {
    const body = new FormData();
    for (const [key, value] of original) body.append(key, value);
    for (const [key, value] of Object.entries(values)) body.set(key, value);
    const response = await fetch(`${origin}${path}`, {
      method: "POST", headers: { Origin: origin, Cookie: this.cookie }, body, redirect: "manual",
    });
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(";")[0];
      const separator = pair.indexOf("=");
      this.cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
    return { status: response.status, location: response.headers.get("location"), html: await response.text() };
  }
}

const admin = new BrowserSession();
const visitor = new BrowserSession();
const member = new BrowserSession();

before(async () => {
  directory = await mkdtemp(join(tmpdir(), "wlhl-access-test-"));
  const url = `file:${join(directory, "club.db")}`;
  db = createClient({ url });
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", "3131"], {
    env: { ...process.env, VERCEL: "", TURSO_DATABASE_URL: url, TURSO_AUTH_TOKEN: "",
      ADMIN_PASSWORD: "access-test-admin", SESSION_SECRET: secret,
      STRIPE_SECRET_KEY: "", STRIPE_WEBHOOK_SECRET: "", NEXT_PUBLIC_VAPID_PUBLIC_KEY: "", VAPID_PRIVATE_KEY: "" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  for (const stream of [server.stdout, server.stderr]) stream?.on("data", (chunk) => { output = (output + chunk).slice(-6000); });
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(`Server exited: ${output}`);
    try { if ((await fetch(`${origin}/api/health`)).ok) { ready = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(ready, output);
  await admin.post("/admin/login", formFrom(await admin.get("/admin/login"), "password"), { password: "access-test-admin" });
  assert.ok(admin.cookies.get("wlhl_admin"));
  for (const [id, status] of [["owner", "active"], ["victim", "active"], ["pending", "pending"]]) {
    await db.execute({ sql: `INSERT INTO members (id, first_name, last_name, email, phone, membership_status, joined_at, notes)
      VALUES (?, ?, 'Fixture', ?, '2025550199', ?, ?, 'Private staff notes')`,
      args: [id, id, `${id}@example.invalid`, status, new Date().toISOString()] });
  }
  member.cookies.set("wlhl_member", issueSession("owner", "member", secret));
});

after(async () => {
  if (server && server.exitCode === null) {
    const exited = new Promise((resolve) => server.once("exit", resolve));
    server.kill("SIGTERM"); await exited;
  }
  db?.close();
  if (directory) await rm(directory, { recursive: true, force: true });
});

test("every public route works and every admin route rejects visitors and members", async () => {
  for (const prefix of ["", "/cn"]) {
    for (const route of ["", "/about", "/events", "/join", "/member", "/shop", "/shop/success", "/events/ai-health-wealth-forum"]) await visitor.get(`${prefix}${route}` || "/");
  }
  for (const path of ["/admin", "/admin/pages", "/admin/landing-page-editor", "/admin/database", "/admin/design-gui", "/admin/members/victim"]) {
    for (const session of [visitor, member]) {
      const response = await fetch(`${origin}${path}`, { headers: { Cookie: session.cookie }, redirect: "manual" });
      assert.equal(response.status, 307, path);
      assert.equal(response.headers.get("location"), "/admin/login");
    }
    await admin.get(path);
  }
  for (const session of [visitor, member]) assert.equal((await fetch(`${origin}/api/admin/export`, { headers: { Cookie: session.cookie } })).status, 401);
  assert.equal((await fetch(`${origin}/api/admin/export`, { headers: { Cookie: admin.cookie } })).status, 200);
});

test("administrators can save every public page in either language; stale saves cannot replace newer content", async () => {
  for (const page of editablePages) {
    for (const locale of ["en", "cn"] as const) {
      const path = `/admin/pages?page=${page.id}&locale=${locale}`;
      const form = formFrom(await admin.get(path), "page");
      const original = pageCopyFields(page.id, locale)[0];
      const marker = `Published ${page.id} ${locale} fixture`;
      const result = await admin.post(path, form, { "copy:0": marker });
      assert.equal(result.status, 303);
      assert.ok(result.location?.includes("saved="), result.location ?? result.html);
      const publicPath = `${locale === "cn" ? "/cn" : ""}${page.path}`;
      assert.ok((await visitor.get(publicPath)).includes(marker), publicPath);
      const row = (await db.execute({ sql: "SELECT content_json FROM page_content WHERE page = ? AND locale = ?", args: [page.id, locale] })).rows[0];
      assert.equal(JSON.parse(String(row.content_json))[original], marker);
      const stale = await admin.post(path, form, { "copy:0": "Stale overwrite" });
      assert.ok(stale.location?.includes("error="));
      assert.ok((await visitor.get(publicPath)).includes(marker));
    }
  }
  const path = "/admin/pages?page=about&locale=en";
  const form = formFrom(await admin.get(path), "page");
  const invalid = await admin.post(path, form, { "copy:0": "x".repeat(4001) });
  assert.ok(invalid.location?.includes("error="));
  const escaped = await admin.post(path, form, { "copy:0": '<script id="injected">alert(1)</script>' });
  assert.ok(escaped.location?.includes("saved="));
  const html = await visitor.get("/about");
  assert.ok(!html.includes('<script id="injected">'));
  assert.ok(html.includes("&lt;script"));
});

test("replaying actual admin save forms with a visitor or member cookie never changes records", async () => {
  const cases = [
    ["/admin/pages?page=events", "page"],
    ["/admin/landing-page-editor", "brandName"],
    ["/admin/landing-page-editor", "eventId"],
    ["/admin/landing-page-editor", "announcementId"],
    ["/admin/landing-page-editor", "productId"],
    ["/admin/landing-page-editor", "image"],
    ["/admin?view=events", "title"],
    ["/admin?view=announcements", "title"],
    ["/admin?view=products", "name"],
    ["/admin?view=experts", "nameEn"],
    ["/admin?view=members", "memberId"],
    ["/admin?view=attendance", "eventId"],
    ["/admin/members/victim", "firstName"],
  ];
  const snapshot = async () => JSON.stringify(await Promise.all(["members", "events", "announcements", "products", "expert_profiles", "landing_page_content", "landing_page_assets", "page_content", "activity_logs"].map(async (table) => (await db.execute(`SELECT * FROM ${table} ORDER BY rowid`)).rows)));
  const before = await snapshot();
  for (const [path, field] of cases) {
    const form = formFrom(await admin.get(path), field);
    for (const session of [visitor, member]) {
      const result = await session.post(path, form);
      assert.equal(result.status, 303, `${path} ${field}`);
      assert.equal(result.location, "/admin/login", `${path} ${field}`);
    }
  }
  assert.equal(await snapshot(), before);
});

test("member profile edits use the session identity and ignore forged IDs and privileged fields", async () => {
  const form = formFrom(await member.get("/member"), "firstName");
  const rejected = await visitor.post("/member", form, { firstName: "Attacker", lastName: "Fixture", interests: "" });
  assert.ok(rejected.location?.includes("error="));
  const result = await member.post("/member", form, {
    memberId: "victim", firstName: "Updated owner", lastName: "Fixture", interests: "Walking",
    email: "attacker@example.invalid", phone: "0000000000", membershipTier: "Lifetime Membership", membership_status: "paused", notes: "Changed",
  });
  assert.ok(result.location?.includes("saved="));
  const owner = (await db.execute("SELECT * FROM members WHERE id = 'owner'")).rows[0];
  assert.equal(owner.first_name, "Updated owner");
  assert.equal(owner.email, "owner@example.invalid");
  assert.equal(owner.phone, "2025550199");
  assert.equal(owner.membership_status, "active");
  assert.equal(owner.membership_tier, "Community");
  assert.equal(owner.notes, "Private staff notes");
  assert.equal((await db.execute("SELECT first_name FROM members WHERE id = 'victim'")).rows[0].first_name, "victim");
  assert.ok(!(await member.get("/member")).includes("Private staff notes"));
});

test("public forum forms cannot overwrite an existing account or issue a session for its owner", async () => {
  const path = "/events/ai-health-wealth-forum";
  const form = formFrom(await visitor.get(path), "firstName");
  for (const session of [visitor, member]) {
    const cookieBefore = session.cookie;
    const result = await session.post(path, form, { firstName: "Impostor", lastName: "Changed", email: "victim@example.invalid", phone: "2025550000", languagePreference: "English" });
    assert.ok(result.html.includes('role="alert"'));
    assert.equal(session.cookie, cookieBefore);
  }
  const victim = (await db.execute("SELECT * FROM members WHERE id = 'victim'")).rows[0];
  assert.equal(victim.first_name, "victim");
  assert.equal(victim.phone, "2025550199");
  assert.equal((await db.execute("SELECT COUNT(*) AS count FROM event_registrations WHERE member_id = 'victim'")).rows[0].count, 0);
  const own = await member.post(path, form, { firstName: "Updated owner", lastName: "Fixture", email: "owner@example.invalid", phone: "2025550199", languagePreference: "English" });
  assert.ok(own.html.includes('role="status"'));
});

test("all existing records are editable, including nonfeatured and hidden records, with bilingual updates", async () => {
  const path = "/admin/landing-page-editor";
  const events = (await db.execute("SELECT * FROM events ORDER BY event_date")).rows;
  const event = events[events.length - 1];
  const form = formFrom(await admin.get(path), "eventId", String(event.id));
  const result = await admin.post(path, form, { title: "Edited nonfeatured gathering", capacity: "42", status: "upcoming" });
  assert.ok(result.location?.includes("saved="));
  assert.equal((await db.execute({ sql: "SELECT capacity FROM events WHERE id = ?", args: [event.id] })).rows[0].capacity, 42);
  assert.ok((await visitor.get("/events")).includes("Edited nonfeatured gathering"));
  const product = (await db.execute("SELECT * FROM products LIMIT 1")).rows[0];
  await db.execute({ sql: "UPDATE products SET active = 0 WHERE id = ?", args: [product.id] });
  const chinese = `${path}?locale=cn`;
  const productForm = formFrom(await admin.get(chinese), "productId", String(product.id));
  const updated = await admin.post(chinese, productForm, { name: "中文商品编辑验证", description: "管理员保存的商品描述验证内容。" });
  assert.ok(updated.location?.includes("saved="));
  await db.execute({ sql: "UPDATE products SET active = 1 WHERE id = ?", args: [product.id] });
  assert.ok((await visitor.get(`/cn/shop/${product.id}`)).includes("中文商品编辑验证"));
  assert.ok((await visitor.get(`/shop/${product.id}`)).includes(String(product.name)));
});

test("forged, expired and cross-role cookies cannot grant admin access", async () => {
  const cookies = [
    "wlhl_admin=admin.invalid", `wlhl_admin=${issueSession("admin", "member", secret)}`,
    `wlhl_admin=${issueSession("admin", "admin", secret, Date.now() - 31 * 86400_000)}`,
  ];
  for (const cookie of cookies) {
    const response = await fetch(`${origin}/admin/pages`, { headers: { Cookie: cookie }, redirect: "manual" });
    assert.equal(response.status, 307);
    assert.equal(response.headers.get("location"), "/admin/login");
  }
});

test("home copy and uploaded images save for administrators and reach shared public headers", async () => {
  const path = "/admin/landing-page-editor";
  const form = formFrom(await admin.get(path), "brandName");
  const saved = await admin.post(path, form, { brandName: "Editable shared brand", contactEmail: "club@example.invalid" });
  assert.ok(saved.location?.includes("saved="));
  for (const route of ["/", "/about", "/events", "/join", "/shop", "/member", "/events/ai-health-wealth-forum"]) {
    assert.ok((await visitor.get(route)).includes("Editable shared brand"), route);
  }
  const png = new Uint8Array(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aB9sAAAAASUVORK5CYII=", "base64"));
  const upload = formFrom(await admin.get(path), "image", 'value="logo"');
  const uploaded = await admin.post(path, upload, { image: new Blob([png], { type: "image/png" }) });
  assert.ok(uploaded.location?.includes("saved="));
  const image = await fetch(`${origin}/api/landing-page-assets/logo`);
  assert.equal(image.headers.get("content-type"), "image/png");
  assert.deepEqual(new Uint8Array(await image.arrayBuffer()), png);
  assert.ok((await visitor.get("/about")).includes("/api/landing-page-assets/logo"));
  const remove = formFrom(await admin.get(path), "slot", "Restore default artwork");
  const denied = await visitor.post(path, remove);
  assert.equal(denied.location, "/admin/login");
  const removed = await admin.post(path, remove);
  assert.ok(removed.location?.includes("saved="));
  assert.equal((await fetch(`${origin}/api/landing-page-assets/logo`)).status, 404);
});

test("administrators can update member contact details and plans", async () => {
  const path = "/admin/members/victim";
  const form = formFrom(await admin.get(path), "firstName");
  const saved = await admin.post(path, form, { phone: "2025550177", membershipTier: "Lifetime Membership" });
  assert.ok(saved.location?.includes("saved="));
  const row = (await db.execute("SELECT phone, membership_tier FROM members WHERE id = 'victim'")).rows[0];
  assert.equal(row.phone, "2025550177");
  assert.equal(row.membership_tier, "Lifetime Membership");
});

test("members cannot reserve for others, bypass approval or reset completed attendance", async () => {
  const path = "/member";
  const form = formFrom(await member.get(path), "eventId");
  const eventId = String(form.get("eventId"));
  const pending = new BrowserSession();
  pending.cookies.set("wlhl_member", issueSession("pending", "member", secret));
  await pending.post(path, form);
  assert.equal((await db.execute("SELECT COUNT(*) AS count FROM attendance WHERE member_id = 'pending'")).rows[0].count, 0);
  await member.post(path, form, { memberId: "victim" });
  assert.equal((await db.execute({ sql: "SELECT COUNT(*) AS count FROM attendance WHERE event_id = ? AND member_id = 'owner'", args: [eventId] })).rows[0].count, 1);
  assert.equal((await db.execute("SELECT COUNT(*) AS count FROM attendance WHERE member_id = 'victim'")).rows[0].count, 0);
  await db.execute({ sql: "UPDATE attendance SET status = 'completed' WHERE event_id = ? AND member_id = 'owner'", args: [eventId] });
  await member.post(path, form);
  assert.equal((await db.execute({ sql: "SELECT status FROM attendance WHERE event_id = ? AND member_id = 'owner'", args: [eventId] })).rows[0].status, "completed");
});

test("member login guesses are limited across independent browser sessions", async () => {
  const form = formFrom(await visitor.get("/member"), "phoneLastFour");
  for (let attempt = 0; attempt < 10; attempt++) {
    const browser = new BrowserSession();
    await browser.post("/member", form, { email: "victim@example.invalid", phoneLastFour: "0000" });
    assert.equal(browser.cookies.get("wlhl_member"), undefined);
  }
  const browser = new BrowserSession();
  const blocked = await browser.post("/member", form, { email: "victim@example.invalid", phoneLastFour: "0177" });
  assert.ok(blocked.location?.includes("Too%20many"));
  assert.equal(browser.cookies.get("wlhl_member"), undefined);
});

test("the approval queue requires website admin login and preserves its destination", async () => {
  for (const session of [visitor, member]) {
    const response = await fetch(`${origin}/admin?view=approvals`, { headers: { Cookie: session.cookie }, redirect: "manual" });
    assert.equal(response.status, 307);
    assert.equal(response.headers.get("location"), "/admin/login?view=approvals");
    assert.ok(!(await response.text()).includes("pending@example.invalid"));
  }
  const browser = new BrowserSession();
  const login = formFrom(await browser.get("/admin/login?view=approvals"), "password");
  const incorrect = await browser.post("/admin/login?view=approvals", login, { password: "incorrect" });
  assert.equal(incorrect.location, "/admin/login?view=approvals&error=Incorrect+password");
  const signedIn = await browser.post("/admin/login?view=approvals", login, { password: "access-test-admin" });
  assert.equal(signedIn.location, "/admin?view=approvals");
  const forged = await browser.post("/admin/login", login, { password: "access-test-admin", view: "https://example.invalid/" });
  assert.equal(forged.location, "/admin");
});

test("the pending queue lets administrators approve a member without granting shop or member access", async () => {
  const path = "/admin?view=approvals";
  const html = await admin.get(path);
  assert.ok(html.includes("待审核会员"));
  assert.ok(html.includes("pending@example.invalid"));
  assert.ok(!html.includes("victim@example.invalid"));
  const form = formFrom(html, "memberId", 'value="pending"');
  const shop = new BrowserSession();
  shop.cookies.set("Access-Token", "shop-session-without-website-admin");
  for (const session of [visitor, member, shop]) {
    const rejected = await session.post(path, form);
    assert.equal(rejected.location, "/admin/login");
    assert.equal((await db.execute("SELECT membership_status FROM members WHERE id = 'pending'")).rows[0].membership_status, "pending");
  }
  const approved = await admin.post(path, form);
  assert.ok(approved.location?.startsWith("/admin?view=approvals&saved="));
  assert.equal((await db.execute("SELECT membership_status FROM members WHERE id = 'pending'")).rows[0].membership_status, "active");
  assert.ok(!(await admin.get(path)).includes("pending@example.invalid"));
  assert.equal((await db.execute("SELECT COUNT(*) AS count FROM activity_logs WHERE member_id = 'pending' AND activity_type = 'membership_status_updated'")).rows[0].count, 1);
});
