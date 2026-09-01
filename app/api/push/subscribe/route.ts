import { NextResponse } from "next/server";
import { z } from "zod";
import { execute } from "@/lib/db";
import { getMemberSession } from "@/lib/auth";

const subscriptionSchema = z.object({
  endpoint: z.url().max(2048).refine((value) => new URL(value).protocol === "https:", "HTTPS is required"),
  keys: z.object({ p256dh: z.string().min(1).max(512), auth: z.string().min(1).max(512) }),
});

export async function POST(request: Request) {
  const parsed = subscriptionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  const memberId = await getMemberSession();
  await execute(
    `INSERT INTO push_subscriptions (endpoint, p256dh, auth, member_id, created_at)
     VALUES (?, ?, ?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth, member_id = excluded.member_id`,
    [parsed.data.endpoint, parsed.data.keys.p256dh, parsed.data.keys.auth, memberId, new Date().toISOString()],
  );
  return NextResponse.json({ ok: true });
}
