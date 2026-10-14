import assert from "node:assert/strict";
import { test } from "node:test";
import { issueSession, sessionLifetime, sessionSecret, verifySession } from "../lib/session-token";
import { pageCopyFields, validatePageCopy } from "../lib/page-copy";

test("sessions bind identity, role, signature and server-enforced expiration", () => {
  const now = Date.now();
  const token = issueSession("member-one", "member", "fixture-secret", now);
  assert.equal(verifySession(token, "member", "fixture-secret", now), "member-one");
  assert.equal(verifySession(token, "admin", "fixture-secret", now), null);
  assert.equal(verifySession(token, "member", "wrong-secret", now), null);
  assert.equal(verifySession(token, "member", null, now), null);
  assert.equal(verifySession(token, "member", "fixture-secret", now + sessionLifetime * 1000), null);
  for (const malformed of ["admin", `${token}.extra`, token.slice(0, -1), token + "é", ".", "x".repeat(3000)]) {
    assert.equal(verifySession(malformed, "member", "fixture-secret", now), null);
  }
  assert.equal(sessionSecret({ NODE_ENV: "production" }), null);
});

test("page content accepts only known fields and safe registration links", () => {
  const original = pageCopyFields("about", "en")[0];
  assert.deepEqual(validatePageCopy("about", "en", { [original]: "Updated title" }), { [original]: "Updated title" });
  assert.throws(() => validatePageCopy("about", "en", { unknown: "Injected field" }));
  assert.throws(() => validatePageCopy("about", "en", { [original]: "x".repeat(4001) }));
  const link = pageCopyFields("about", "en").find((field) => field.startsWith("https://"))!;
  assert.throws(() => validatePageCopy("about", "en", { [link]: "javascript:alert(1)" }));
});
