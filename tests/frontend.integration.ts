import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient, type Client } from "@libsql/client";

const origin = "http://localhost:3129";
let directory: string;
let server: ChildProcess;
let db: Client;
let serverOutput = "";

before(async () => {
  directory = await mkdtemp(join(tmpdir(), "wlhl-frontend-test-"));
  const url = `file:${join(directory, "club.db")}`;
  db = createClient({ url });
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", "3129"], {
    env: {
      ...process.env, VERCEL: "", TURSO_DATABASE_URL: url, TURSO_AUTH_TOKEN: "",
      ADMIN_PASSWORD: "local-integration-admin", SESSION_SECRET: "local-integration-session",
      STRIPE_SECRET_KEY: "", STRIPE_WEBHOOK_SECRET: "",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: "", VAPID_PRIVATE_KEY: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  for (const stream of [server.stdout, server.stderr]) {
    stream?.on("data", (chunk) => { serverOutput = (serverOutput + chunk).slice(-4000); });
  }
  for (let attempt = 0; attempt < 80; attempt++) {
    if (server.exitCode !== null) throw new Error(`Test server exited: ${serverOutput}`);
    try {
      if ((await fetch(`${origin}/api/health`)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Test server did not start: ${serverOutput}`);
});

after(async () => {
  if (server && server.exitCode === null) {
    const exited = new Promise((resolve) => server.once("exit", resolve));
    server.kill("SIGTERM");
    await exited;
  }
  db?.close();
  if (directory) await rm(directory, { recursive: true, force: true });
});

const decodeAttribute = (value: string) => value.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&");

// Submit the actual rendered form and its action reference, as a browser does
// before hydration. This catches broken frontend-to-action wiring as well as SQL failures.
class BrowserSession {
  cookie = "";

  async get(path: string) {
    const response = await fetch(`${origin}${path}`, { headers: { Cookie: this.cookie } });
    assert.equal(response.status, 200, path);
    return response.text();
  }

  async submit(path: string, field: string, fields: Record<string, string>) {
    const html = await this.get(path);
    const form = [...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)]
      .map((match) => match[0]).find((value) => value.includes(`name="${field}"`));
    assert.ok(form, `Missing ${field} form at ${path}`);
    const body = new FormData();
    for (const match of form.matchAll(/<input\b[^>]*>/g)) {
      if (!match[0].includes('type="hidden"')) continue;
      const name = match[0].match(/name="([^"]+)"/)?.[1];
      const value = match[0].match(/value="([^"]*)"/)?.[1] ?? "";
      if (name) body.set(decodeAttribute(name), decodeAttribute(value));
    }
    for (const [name, value] of Object.entries(fields)) body.set(name, value);
    const response = await fetch(`${origin}${path}`, {
      method: "POST", headers: { Origin: origin, Cookie: this.cookie }, body, redirect: "manual",
    });
    const cookies = response.headers.getSetCookie();
    if (cookies.length) this.cookie = cookies.map((cookie) => cookie.split(";")[0]).join("; ");
    assert.ok(response.status === 200 || response.status === 303, `${path}: ${response.status}`);
    return { response, html: await response.text() };
  }
}

test("health probes the runtime database and pages reflect updates after their first request", async () => {
  const health = await fetch(`${origin}/api/health`);
  assert.equal(health.headers.get("cache-control"), "no-store");
  assert.deepEqual(await health.json(), { status: "ok", database: "connected" });
  const browser = new BrowserSession();
  for (const path of ["/", "/cn", "/about", "/cn/about", "/join", "/cn/join", "/events", "/cn/events"]) {
    await browser.get(path);
  }
  for (const locale of ["en", "cn"]) {
    await db.execute({
      sql: "INSERT INTO landing_page_content (locale, content_json, updated_at) VALUES (?, ?, ?)",
      args: [locale, JSON.stringify({ brandName: `Runtime Club ${locale}` }), new Date().toISOString()],
    });
    const prefix = locale === "cn" ? "/cn" : "";
    for (const path of ["", "/about", "/join", "/events"]) {
      assert.ok((await browser.get(`${prefix}${path}` || "/")).includes(`Runtime Club ${locale}`), `Stale page: ${prefix}${path}`);
    }
  }
});

test("Chinese membership forms save to the database, appear in admin, and support member login", async () => {
  const member = new BrowserSession();
  const fields = {
    firstName: "明", lastName: "王", email: "membership@example.invalid", phone: "2025550199",
    membershipTier: "Lifetime Membership", locale: "cn", emailOptIn: "on",
  };
  const invalid = await member.submit("/cn/join", "firstName", { ...fields, firstName: " " });
  assert.ok(invalid.html.includes('role="alert"'));
  const joined = await member.submit("/cn/join", "firstName", fields);
  assert.ok(joined.html.includes('role="status"'));
  assert.ok(member.cookie.startsWith("wlhl_member="));
  const row = (await db.execute({ sql: "SELECT * FROM members WHERE email = ?", args: [fields.email] })).rows[0];
  assert.equal(row.first_name, "明");
  assert.equal(row.last_name, "王");
  assert.equal(row.membership_status, "pending");
  assert.ok((await member.get("/cn/member")).includes("明"));

  const duplicate = await new BrowserSession().submit("/join", "firstName", { ...fields, locale: "en" });
  assert.ok(duplicate.html.includes("already registered"));
  const returning = new BrowserSession();
  const rejected = await returning.submit("/cn/member", "phoneLastFour", { email: fields.email, phoneLastFour: "0000" });
  assert.ok(rejected.response.headers.get("location")?.includes("error="));
  assert.equal(returning.cookie, "");
  const login = await returning.submit("/cn/member", "phoneLastFour", { email: fields.email, phoneLastFour: "0199" });
  assert.equal(login.response.headers.get("location"), "/cn/member");
  assert.ok(returning.cookie.startsWith("wlhl_member="));

  const admin = new BrowserSession();
  await admin.submit("/admin/login", "password", { password: "local-integration-admin" });
  assert.ok((await admin.get("/admin?view=members")).includes(fields.email));
  await admin.submit("/admin?view=members", "memberId", { memberId: String(row.id), status: "active" });
  assert.ok((await returning.get("/member")).includes("status-badge status-active"));
});

test("forum registration writes linked member, registration, attendance, and activity records", async () => {
  const browser = new BrowserSession();
  const fields = {
    firstName: "华", lastName: "李", email: "forum@example.invalid", phone: "2025550188",
    locale: "cn", languagePreference: "中文", organization: "Integration fixture",
  };
  const result = await browser.submit("/cn/events/ai-health-wealth-forum", "firstName", fields);
  assert.ok(result.html.includes('role="status"'));
  const member = (await db.execute({ sql: "SELECT id FROM members WHERE email = ?", args: [fields.email] })).rows[0];
  for (const table of ["event_registrations", "attendance", "activity_logs"]) {
    const result = await db.execute({ sql: `SELECT COUNT(*) AS count FROM ${table} WHERE member_id = ?`, args: [member.id] });
    assert.equal(result.rows[0].count, 1, table);
  }
  assert.ok((await browser.get("/cn/member")).includes("华"));
});

test("admin-created events reach both language calendars and member reservations reach admin", async () => {
  const admin = new BrowserSession();
  await admin.submit("/admin/login", "password", { password: "local-integration-admin" });
  await admin.get("/events");
  await admin.get("/cn/events");
  await admin.submit("/admin?view=events", "title", {
    title: "Connected Calendar Fixture", description: "A temporary integration event.",
    eventDate: new Date(Date.now() + 86_400_000).toISOString().slice(0, 16),
    capacity: "30", location: "Test location", category: "Community",
  });
  for (const path of ["/events", "/cn/events"]) {
    assert.ok((await admin.get(path)).includes("Connected Calendar Fixture"), path);
  }
  const member = new BrowserSession();
  await member.submit("/member", "phoneLastFour", { email: "membership@example.invalid", phoneLastFour: "0199" });
  assert.ok((await member.get("/member")).includes("Connected Calendar Fixture"));
  const event = (await db.execute("SELECT id FROM events WHERE title = 'Connected Calendar Fixture'")).rows[0];
  await member.submit("/member", "eventId", { eventId: String(event.id) });
  const reservations = await db.execute({ sql: "SELECT COUNT(*) AS count FROM attendance WHERE event_id = ?", args: [event.id] });
  assert.equal(reservations.rows[0].count, 1);
  assert.ok((await admin.get("/admin?view=attendance")).includes("Connected Calendar Fixture"));
});
