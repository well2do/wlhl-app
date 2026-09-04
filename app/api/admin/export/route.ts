import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getMembers } from "@/lib/db";

function csvCell(value: unknown) {
  let safe = String(value ?? "");
  if (/^[=+\-@]/.test(safe)) safe = `'${safe}`;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const members = await getMembers();
  const header = ["First name", "Last name", "Email", "Phone", "Birthday", "Interests", "Membership tier", "Status", "Joined", "Email opt-in", "SMS opt-in", "Notes"];
  const lines = [header.map(csvCell).join(","), ...members.map((member) => [member.first_name, member.last_name, member.email, member.phone, member.birthday, member.interests, member.membership_tier, member.membership_status, member.joined_at, member.email_opt_in ? "Yes" : "No", member.sms_opt_in ? "Yes" : "No", member.notes].map(csvCell).join(","))];
  return new NextResponse(lines.join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="caucc-members-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
