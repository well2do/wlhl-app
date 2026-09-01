import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Bell, CalendarCheck2, ClipboardList, Database, LogOut, Mail, Phone, ScrollText, UserRound } from "lucide-react";
import { adminLogoutAction } from "@/app/actions";
import { Brand } from "@/components/brand";
import { isAdmin } from "@/lib/auth";
import { getActivityLogs, getEventRegistrations, getMember, getMemberAttendance } from "@/lib/db";
import { formatEventDate, initials } from "@/lib/format";

export const metadata = { title: "Member Profile" };

export default async function AdminMemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { id } = await params;
  const member = await getMember(id);
  if (!member) notFound();

  const [attendance, registrations, activityLogs] = await Promise.all([
    getMemberAttendance(id), getEventRegistrations(id), getActivityLogs(id),
  ]);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar member-profile-sidebar">
        <Brand inverse />
        <nav>
          <Link href="/admin?view=members"><ArrowLeft size={18} />Member directory</Link>
          <Link href="/admin"><UserRound size={18} />Admin overview</Link>
          <Link href="/admin?view=registrations"><ClipboardList size={18} />Registrations</Link>
          <Link href="/admin?view=activity"><ScrollText size={18} />Activity log</Link>
          <Link href="/admin/database"><Database size={18} />Database</Link>
        </nav>
        <div className="admin-sidebar-bottom"><Link href="/">View club website</Link><form action={adminLogoutAction}><button><LogOut size={17} />Sign out</button></form></div>
      </aside>

      <main className="admin-main member-profile-main">
        <Link className="mobile-admin-back" href="/admin?view=members"><ArrowLeft size={15} />Back to members</Link>
        <section className="profile-identity">
          <span className="profile-avatar">{initials(member.first_name, member.last_name)}</span>
          <div><p className="eyebrow">Member profile</p><h1>{member.first_name} {member.last_name}</h1><p>Joined {new Date(member.joined_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p></div>
          <span className={`profile-status status-${member.membership_status}`}>{member.membership_status}</span>
        </section>

        <section className="profile-summary-grid">
          <article><span><Mail size={19} /></span><small>Email address</small><strong>{member.email}</strong></article>
          <article><span><Phone size={19} /></span><small>Mobile phone</small><strong>{member.phone}</strong></article>
          <article><span><UserRound size={19} /></span><small>Membership</small><strong>{member.membership_tier}</strong></article>
          <article><span><Bell size={19} /></span><small>Communication</small><strong>{member.email_opt_in ? "Email" : "No email"}{member.sms_opt_in ? " + SMS" : ""}</strong></article>
        </section>

        <div className="profile-two-col">
          <section className="admin-panel profile-info-panel">
            <div className="admin-panel-heading"><div><h2>Registration information</h2><p>Information provided when joining or registering</p></div></div>
            <dl className="profile-data-list">
              <div><dt>Full name</dt><dd>{member.first_name} {member.last_name}</dd></div>
              <div><dt>Date of birth</dt><dd>{member.birthday ? new Date(`${member.birthday}T12:00:00`).toLocaleDateString() : "Not provided"}</dd></div>
              <div><dt>Interests</dt><dd>{member.interests || "Not provided"}</dd></div>
              <div><dt>Membership status</dt><dd className="capitalize">{member.membership_status}</dd></div>
              <div><dt>Member notes</dt><dd>{member.notes || "No notes"}</dd></div>
            </dl>
          </section>

          <section className="admin-panel profile-info-panel">
            <div className="admin-panel-heading"><div><h2>Engagement summary</h2><p>Registrations and recorded activity</p></div></div>
            <div className="profile-engagement-stats">
              <div><span><ClipboardList size={20} /></span><strong>{registrations.length}</strong><small>Event registrations</small></div>
              <div><span><CalendarCheck2 size={20} /></span><strong>{attendance.length}</strong><small>Attendance records</small></div>
              <div><span><ScrollText size={20} /></span><strong>{activityLogs.length}</strong><small>Activity log entries</small></div>
            </div>
          </section>
        </div>

        <section className="admin-panel profile-section">
          <div className="admin-panel-heading"><div><h2>Event registration details</h2><p>All forms submitted by this member</p></div></div>
          <div className="table-wrap"><table><thead><tr><th>Event</th><th>Organization</th><th>Role</th><th>Language</th><th>Referral</th><th>Notes</th><th>Status</th><th>Submitted</th></tr></thead><tbody>{registrations.map((registration) => <tr key={registration.id}><td><strong className="table-primary">{registration.event_title}</strong><br /><small>{registration.event_date ? formatEventDate(registration.event_date, true) : ""}</small></td><td>{registration.organization || "—"}</td><td>{registration.job_title || "—"}</td><td>{registration.language_preference}</td><td>{registration.referral_source || "—"}</td><td className="log-description">{registration.accessibility_notes || "—"}</td><td><span className={`table-status attendance-${registration.status}`}>{registration.status}</span></td><td>{new Date(registration.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>
          {registrations.length === 0 && <p className="admin-empty">No public event registration forms for this member.</p>}
        </section>

        <section className="admin-panel profile-section">
          <div className="admin-panel-heading"><div><h2>Attendance and event history</h2><p>Registered, attended, and completed events</p></div></div>
          <div className="table-wrap"><table><thead><tr><th>Event</th><th>Date</th><th>Status</th><th>Check-in time</th></tr></thead><tbody>{attendance.map((record) => <tr key={record.id}><td><strong className="table-primary">{record.event_title}</strong></td><td>{record.event_date ? formatEventDate(record.event_date, true) : "—"}</td><td><span className={`table-status attendance-${record.status}`}>{record.status}</span></td><td>{record.checked_in_at ? new Date(record.checked_in_at).toLocaleString() : "Not checked in"}</td></tr>)}</tbody></table></div>
          {attendance.length === 0 && <p className="admin-empty">No attendance records for this member.</p>}
        </section>

        <section className="admin-panel profile-section">
          <div className="admin-panel-heading"><div><h2>Activity log</h2><p>Chronological member and administrative actions</p></div></div>
          <div className="profile-timeline">{activityLogs.map((log) => <article key={log.id}><span className={`timeline-dot actor-${log.actor_type}`} /><div><p><strong>{log.activity_type.replaceAll("_", " ")}</strong><span>{new Date(log.created_at).toLocaleString()}</span></p><p>{log.description}</p>{log.event_title && <small>{log.event_title}</small>}</div></article>)}</div>
          {activityLogs.length === 0 && <p className="admin-empty">No logged activity for this member yet.</p>}
        </section>
      </main>
    </div>
  );
}
