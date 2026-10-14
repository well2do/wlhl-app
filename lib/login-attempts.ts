import { createHash } from "node:crypto";
import { execute } from "./db";

const windowSeconds = 15 * 60;

export async function allowLoginAttempt(scope: string, identifier: string) {
  const key = createHash("sha256").update(`${scope}:${identifier.trim().toLowerCase()}`).digest("hex");
  const now = Math.floor(Date.now() / 1000);
  await execute("DELETE FROM login_attempts WHERE reset_at <= ?", [now]);
  const result = await execute(
    `INSERT INTO login_attempts (key, attempts, reset_at) VALUES (?, 1, ?)
     ON CONFLICT(key) DO UPDATE SET attempts = attempts + 1
     RETURNING attempts`,
    [key, now + windowSeconds],
  );
  return Number(result.rows[0].attempts) <= 10;
}
