"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { execute } from "@/lib/db";

const schema = z.object({
  memberId: z.string().min(1).max(100),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.email().max(254).transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(50).refine((value) => value.replace(/\D/g, "").length >= 7),
  membershipTier: z.enum(["Community", "Event Guest", "Annual Membership (2026 Promotion)", "2026 Annual Renewal", "Lifetime Membership"]),
  notes: z.string().max(4000),
});

export async function updateMemberDetailsAction(formData: FormData) {
  await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin?view=members&error=Please+check+the+member+fields");
  const member = parsed.data;
  const path = `/admin/members/${encodeURIComponent(member.memberId)}`;
  try {
    const result = await execute(
      "UPDATE members SET first_name = ?, last_name = ?, email = ?, phone = ?, membership_tier = ?, notes = ? WHERE id = ?",
      [member.firstName, member.lastName, member.email, member.phone, member.membershipTier, member.notes, member.memberId],
    );
    if (result.rowsAffected !== 1) throw new Error("Member not found.");
  } catch {
    redirect(`${path}?error=Could+not+save.+Check+that+the+email+is+not+already+in+use.`);
  }
  await execute(
    `INSERT INTO activity_logs (id, member_id, activity_type, description, actor_type, created_at)
     VALUES (?, ?, 'member_details_updated', 'Administrator updated member contact details and plan.', 'admin', ?)`,
    [crypto.randomUUID(), member.memberId, new Date().toISOString()],
  );
  revalidatePath("/", "layout");
  redirect(`${path}?saved=Member+details+saved`);
}
