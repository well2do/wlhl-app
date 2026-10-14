import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { databaseConfig } from "../lib/database-config";
import { execute } from "../lib/db";

test("local and hosted database configuration cannot silently select the wrong database", () => {
  assert.deepEqual(databaseConfig({}), { url: "file:data/wlhl.db" });
  assert.deepEqual(databaseConfig({ TURSO_DATABASE_URL: "  ", TURSO_AUTH_TOKEN: " " }), { url: "file:data/wlhl.db" });
  assert.throws(() => databaseConfig({ VERCEL: "1" }), /TURSO_DATABASE_URL/);
  assert.throws(() => databaseConfig({ VERCEL: "1", TURSO_DATABASE_URL: "file:data/wlhl.db" }), /remote database/);
  assert.throws(() => databaseConfig({ TURSO_DATABASE_URL: "libsql://your-database-name-your-org.turso.io" }), /example values/);
  assert.throws(() => databaseConfig({ TURSO_DATABASE_URL: "libsql://fixture.turso.io" }), /TURSO_AUTH_TOKEN/);
  assert.throws(() => databaseConfig({ TURSO_AUTH_TOKEN: "fixture" }), /TURSO_DATABASE_URL/);
  assert.deepEqual(databaseConfig({ TURSO_DATABASE_URL: " libsql://fixture.turso.io ", TURSO_AUTH_TOKEN: " fixture " }), {
    url: "libsql://fixture.turso.io", authToken: "fixture",
  });
});

test("database initialization recovers after a connection failure in the same process", async () => {
  const directory = await mkdtemp(join(tmpdir(), "wlhl-database-test-"));
  const original = { url: process.env.TURSO_DATABASE_URL, token: process.env.TURSO_AUTH_TOKEN, vercel: process.env.VERCEL };
  process.env.TURSO_DATABASE_URL = `file:${join(directory, "missing", "club.db")}`;
  process.env.TURSO_AUTH_TOKEN = "";
  process.env.VERCEL = "";
  try {
    await assert.rejects(execute("SELECT 1"));
    await mkdir(join(directory, "missing"));
    const results = await Promise.all([execute("SELECT 1 AS connected"), execute("SELECT 1 AS connected")]);
    for (const result of results) assert.equal(result.rows[0].connected, 1);
    await execute("UPDATE expert_profiles SET name_en = 'Administrator edit' WHERE id = 'shen-peihong'");
    await execute("DELETE FROM expert_profiles WHERE id = 'liu-meichang'");
    await execute(
      "INSERT INTO activity_logs (id, activity_type, description, actor_type, metadata, created_at) VALUES (?, 'expert_deleted', 'Deleted fixture', 'admin', ?, ?)",
      [crypto.randomUUID(), JSON.stringify({ expertId: "liu-meichang" }), new Date().toISOString()],
    );
    global.wlhlDatabaseReady = undefined;
    assert.equal((await execute("SELECT COUNT(*) AS count FROM expert_profiles WHERE id = 'liu-meichang'")).rows[0].count, 0);
    assert.equal((await execute("SELECT name_en FROM expert_profiles WHERE id = 'shen-peihong'")).rows[0].name_en, "Administrator edit");
  } finally {
    global.wlhlDatabase?.close();
    global.wlhlDatabase = undefined;
    global.wlhlDatabaseReady = undefined;
    for (const [key, value] of Object.entries({ TURSO_DATABASE_URL: original.url, TURSO_AUTH_TOKEN: original.token, VERCEL: original.vercel })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
    await rm(directory, { recursive: true, force: true });
  }
});
