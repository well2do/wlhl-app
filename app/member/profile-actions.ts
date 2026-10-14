"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getMemberSession } from "@/lib/auth";
import { execute } from "@/lib/db";

const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  interests: z.string().trim().max(500),
});

export async function updateMemberProfileAction(formData: FormData) {
  const returnTo = formData.get("locale") === "cn" ? "/cn/member" : "/member";
  const memberId = await getMemberSession();
  if (!memberId) redirect(`${returnTo}?error=Please+sign+in`);
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`${returnTo}?error=Please+check+your+profile+fields`);
  // Identity, membership tier, status and staff notes never come from this form.
  const result = await execute(
    "UPDATE members SET first_name = ?, last_name = ?, interests = ?, email_opt_in = ?, sms_opt_in = ? WHERE id = ?",
    [parsed.data.firstName, parsed.data.lastName, parsed.data.interests,
      formData.has("emailOptIn") ? 1 : 0, formData.has("smsOptIn") ? 1 : 0, memberId],
  );
  if (result.rowsAffected !== 1) redirect(`${returnTo}?error=Please+sign+in+again`);
  await execute(
    `INSERT INTO activity_logs (id, member_id, activity_type, description, actor_type, created_at)
     VALUES (?, ?, 'member_profile_updated', 'Updated own profile and communication preferences.', 'member', ?)`,
    [crypto.randomUUID(), memberId, new Date().toISOString()],
  );
  revalidatePath("/member");
  revalidatePath("/cn/member");
  revalidatePath("/admin");
  revalidatePath(`/admin/members/${memberId}`);
  redirect(`${returnTo}?saved=1#profile`);
}
