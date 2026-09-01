import { createClient, type Client, type InValue } from "@libsql/client";
import type { ActivityLog, Announcement, Attendance, ClubEvent, EventRegistration, Member, Product } from "./types";
import { defaultLandingPageContent, type LandingPageContent } from "./landing-page-content";

declare global {
  // eslint-disable-next-line no-var
  var wlhlDatabase: Client | undefined;
  // eslint-disable-next-line no-var
  var wlhlDatabaseReady: Promise<void> | undefined;
}

function getClient() {
  if (!global.wlhlDatabase) {
    global.wlhlDatabase = createClient({
      url: process.env.TURSO_DATABASE_URL || "file:data/wlhl.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return global.wlhlDatabase;
}

function futureDate(days: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

async function initialize() {
  const client = getClient();
  await client.batch(
    [
      `CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY, first_name TEXT NOT NULL, last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE, phone TEXT NOT NULL, birthday TEXT,
        interests TEXT NOT NULL DEFAULT '', membership_tier TEXT NOT NULL DEFAULT 'Community',
        membership_status TEXT NOT NULL DEFAULT 'pending', joined_at TEXT NOT NULL,
        email_opt_in INTEGER NOT NULL DEFAULT 1, sms_opt_in INTEGER NOT NULL DEFAULT 0,
        notes TEXT NOT NULL DEFAULT ''
      )`,
      `CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL,
        event_date TEXT NOT NULL, end_date TEXT, location TEXT NOT NULL,
        category TEXT NOT NULL, capacity INTEGER NOT NULL DEFAULT 30,
        status TEXT NOT NULL DEFAULT 'upcoming'
      )`,
      `CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY, member_id TEXT NOT NULL, event_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'registered', checked_in_at TEXT,
        UNIQUE(member_id, event_id),
        FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE,
        FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS event_registrations (
        id TEXT PRIMARY KEY, event_id TEXT NOT NULL, member_id TEXT,
        first_name TEXT NOT NULL, last_name TEXT NOT NULL,
        email TEXT NOT NULL COLLATE NOCASE, phone TEXT NOT NULL,
        organization TEXT NOT NULL DEFAULT '', job_title TEXT NOT NULL DEFAULT '',
        language_preference TEXT NOT NULL DEFAULT 'English',
        accessibility_notes TEXT NOT NULL DEFAULT '', referral_source TEXT NOT NULL DEFAULT '',
        marketing_opt_in INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'registered',
        source TEXT NOT NULL DEFAULT 'public_event_page', created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL, UNIQUE(event_id, email),
        FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE SET NULL
      )`,
      `CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY, member_id TEXT, event_id TEXT,
        activity_type TEXT NOT NULL, description TEXT NOT NULL,
        actor_type TEXT NOT NULL DEFAULT 'system', metadata TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE SET NULL,
        FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE SET NULL
      )`,
      `CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, message TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'community', published_at TEXT NOT NULL,
        featured INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL,
        price REAL NOT NULL, category TEXT NOT NULL, badge TEXT NOT NULL DEFAULT '',
        active INTEGER NOT NULL DEFAULT 1
      )`,
      `CREATE TABLE IF NOT EXISTS push_subscriptions (
        endpoint TEXT PRIMARY KEY, p256dh TEXT NOT NULL, auth TEXT NOT NULL,
        member_id TEXT, created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS landing_page_content (
        locale TEXT PRIMARY KEY, content_json TEXT NOT NULL, updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS landing_page_assets (
        slot TEXT PRIMARY KEY, mime_type TEXT NOT NULL, file_name TEXT NOT NULL,
        data BLOB NOT NULL, updated_at TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date)`,
      `CREATE INDEX IF NOT EXISTS idx_attendance_member ON attendance(member_id)`,
      `CREATE INDEX IF NOT EXISTS idx_registrations_event ON event_registrations(event_id)`,
      `CREATE INDEX IF NOT EXISTS idx_registrations_member ON event_registrations(member_id)`,
      `CREATE INDEX IF NOT EXISTS idx_activity_member ON activity_logs(member_id)`,
      `CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at)`,
    ],
    "write",
  );

  const eventCount = Number((await client.execute("SELECT COUNT(*) AS count FROM events")).rows[0].count);
  if (eventCount === 0) {
    await client.batch(
      [
        { sql: "INSERT INTO events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", args: [crypto.randomUUID(), "Morning Mobility & Tai Chi", "A gentle, energizing class focused on balance, flexibility, and everyday strength.", futureDate(6, 9), futureDate(6, 10), "Rock Creek Community Center", "Movement", 30, "upcoming"] },
        { sql: "INSERT INTO events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", args: [crypto.randomUUID(), "Longevity Nutrition Workshop", "Practical guidance for building colorful, heart-healthy meals that fit your life.", futureDate(13, 11), futureDate(13, 12), "WLHL Club Room", "Nutrition", 24, "upcoming"] },
        { sql: "INSERT INTO events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", args: [crypto.randomUUID(), "Community Wellness Walk", "Connect with neighbors on an easy-paced, two-mile guided walk through the gardens.", futureDate(20, 9), futureDate(20, 10), "U.S. National Arboretum", "Community", 40, "upcoming"] },
      ],
      "write",
    );
  }

  const announcementCount = Number((await client.execute("SELECT COUNT(*) AS count FROM announcements")).rows[0].count);
  if (announcementCount === 0) {
    await client.batch(
      [
        { sql: "INSERT INTO announcements VALUES (?, ?, ?, ?, ?, ?)", args: [crypto.randomUUID(), "A healthier season starts together", "Our fall calendar is open. Reserve your place in movement, nutrition, and community wellness events.", "event", new Date().toISOString(), 1] },
        { sql: "INSERT INTO announcements VALUES (?, ?, ?, ?, ?, ?)", args: [crypto.randomUUID(), "Member wellness bundle", "Members save $12 on our tea, journal, and resistance-band wellness bundle this month.", "promotion", futureDate(-1, 10), 0] },
      ],
      "write",
    );
  }

  const productCount = Number((await client.execute("SELECT COUNT(*) AS count FROM products")).rows[0].count);
  const productWasDeleted = (await client.execute(
    "SELECT 1 FROM activity_logs WHERE activity_type = 'product_deleted' LIMIT 1",
  )).rows.length > 0;
  if (productCount === 0 && !productWasDeleted) {
    await client.batch(
      [
        { sql: "INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?)", args: [crypto.randomUUID(), "Daily Vitality Tea", "Caffeine-free herbal blend with ginger, hibiscus, and warming spices.", 18, "Wellness", "Member favorite", 1] },
        { sql: "INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?)", args: [crypto.randomUUID(), "Strong for Life Bands", "Three resistance levels for safe, progressive strength sessions at home.", 24, "Movement", "New", 1] },
        { sql: "INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?)", args: [crypto.randomUUID(), "90-Day Wellness Journal", "Simple daily prompts for movement, hydration, sleep, and gratitude.", 16, "Mindfulness", "", 1] },
      ],
      "write",
    );
  }

  await client.batch(
    [
      {
        sql: `INSERT OR IGNORE INTO events
          (id, title, description, event_date, end_date, location, category, capacity, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          "forum-2026-09-07",
          "AI, Health & Wealth Legacy Forum",
          "A bilingual community forum exploring AI-powered healthy aging, health management, entrepreneurship, trusts, wills, and family wealth legacy.",
          "2026-09-07T18:00:00.000Z",
          "2026-09-07T21:00:00.000Z",
          "7361 Calhoun Place, Rockville, MD 20855",
          "Forum",
          150,
          "upcoming",
        ],
      },
      {
        sql: `INSERT OR IGNORE INTO announcements
          (id, title, message, kind, published_at, featured) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          "announcement-forum-2026-09-07",
          "September 7: AI, Health & Wealth Legacy Forum",
          "Registration is open for our bilingual Rockville forum on healthy longevity, AI, entrepreneurship, and family wealth planning.",
          "event",
          new Date().toISOString(),
          1,
        ],
      },
    ],
    "write",
  );
}

async function db() {
  if (!global.wlhlDatabaseReady) global.wlhlDatabaseReady = initialize();
  await global.wlhlDatabaseReady;
  return getClient();
}

export async function execute(sql: string, args: InValue[] = []) {
  return (await db()).execute({ sql, args });
}

export async function getEvents(includePast = false) {
  const result = await execute(
    `SELECT e.*, COUNT(a.id) AS attendee_count FROM events e
     LEFT JOIN attendance a ON a.event_id = e.id
     ${includePast ? "" : "WHERE e.status = 'upcoming' AND e.event_date >= datetime('now')"}
     GROUP BY e.id ORDER BY e.event_date ASC`,
  );
  return result.rows as unknown as ClubEvent[];
}

export async function getAnnouncements(limit = 10) {
  const result = await execute("SELECT * FROM announcements ORDER BY featured DESC, published_at DESC LIMIT ?", [limit]);
  return result.rows as unknown as Announcement[];
}

export async function getProducts(activeOnly = true) {
  const result = await execute(`SELECT * FROM products ${activeOnly ? "WHERE active = 1" : ""} ORDER BY active DESC, name ASC`);
  return result.rows as unknown as Product[];
}

export async function getLandingPageContent(): Promise<LandingPageContent> {
  const result = await execute("SELECT content_json FROM landing_page_content WHERE locale = 'en' LIMIT 1");
  if (!result.rows[0]?.content_json) return { ...defaultLandingPageContent };

  try {
    const stored = JSON.parse(String(result.rows[0].content_json)) as Record<string, unknown>;
    const content = { ...defaultLandingPageContent } as LandingPageContent;
    for (const key of Object.keys(defaultLandingPageContent) as (keyof LandingPageContent)[]) {
      if (typeof stored[key] === "string") content[key] = stored[key];
    }
    return content;
  } catch {
    return { ...defaultLandingPageContent };
  }
}

export type LandingPageAssetMetadata = {
  slot: string;
  mime_type: string;
  file_name: string;
  updated_at: string;
  byte_size: number;
};

export async function getLandingPageAssetMetadata() {
  const result = await execute(
    "SELECT slot, mime_type, file_name, updated_at, length(data) AS byte_size FROM landing_page_assets ORDER BY slot",
  );
  return result.rows as unknown as LandingPageAssetMetadata[];
}

export async function getMembers() {
  const result = await execute("SELECT * FROM members ORDER BY joined_at DESC");
  return result.rows as unknown as Member[];
}

export async function getMember(id: string) {
  const result = await execute("SELECT * FROM members WHERE id = ? LIMIT 1", [id]);
  return (result.rows[0] as unknown as Member | undefined) ?? null;
}

export async function getMemberAttendance(memberId: string) {
  const result = await execute(
    `SELECT a.*, e.title AS event_title, e.event_date FROM attendance a
     JOIN events e ON e.id = a.event_id WHERE a.member_id = ? ORDER BY e.event_date DESC`,
    [memberId],
  );
  return result.rows as unknown as Attendance[];
}

export async function getAllAttendance() {
  const result = await execute(
    `SELECT a.*, m.first_name, m.last_name, e.title AS event_title, e.event_date
     FROM attendance a JOIN members m ON m.id = a.member_id
     JOIN events e ON e.id = a.event_id ORDER BY e.event_date DESC`,
  );
  return result.rows as unknown as Attendance[];
}

export async function getEventRegistrations(memberId?: string) {
  const result = await execute(
    `SELECT r.*, e.title AS event_title, e.event_date
     FROM event_registrations r JOIN events e ON e.id = r.event_id
     ${memberId ? "WHERE r.member_id = ?" : ""}
     ORDER BY r.created_at DESC`,
    memberId ? [memberId] : [],
  );
  return result.rows as unknown as EventRegistration[];
}

export async function getActivityLogs(memberId?: string, limit = 250) {
  const result = await execute(
    `SELECT l.*, m.first_name, m.last_name, e.title AS event_title
     FROM activity_logs l
     LEFT JOIN members m ON m.id = l.member_id
     LEFT JOIN events e ON e.id = l.event_id
     ${memberId ? "WHERE l.member_id = ?" : ""}
     ORDER BY l.created_at DESC LIMIT ?`,
    memberId ? [memberId, limit] : [limit],
  );
  return result.rows as unknown as ActivityLog[];
}

export async function getDashboardStats() {
  const result = await execute(`SELECT
    (SELECT COUNT(*) FROM members) AS members,
    (SELECT COUNT(*) FROM members WHERE membership_status = 'active') AS active_members,
    (SELECT COUNT(*) FROM events WHERE status = 'upcoming' AND event_date >= datetime('now')) AS upcoming_events,
    (SELECT COUNT(*) FROM attendance WHERE status IN ('attended','completed')) AS check_ins,
    (SELECT COUNT(*) FROM event_registrations WHERE status != 'cancelled') AS registrations`);
  return result.rows[0] as unknown as { members: number; active_members: number; upcoming_events: number; check_ins: number; registrations: number };
}
