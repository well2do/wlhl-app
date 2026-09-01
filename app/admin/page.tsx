import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BellRing,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Database,
  Download,
  Eye,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  ScrollText,
  UserCheck,
  Users,
} from "lucide-react";
import {
  adminLogoutAction,
  createAnnouncementAction,
  createEventAction,
  createProductAction,
  recordAttendanceAction,
  toggleProductAction,
  updateMemberStatusAction,
} from "@/app/actions";
import { Brand } from "@/components/brand";
import { isAdmin } from "@/lib/auth";
import { getActivityLogs, getAllAttendance, getAnnouncements, getDashboardStats, getEventRegistrations, getEvents, getMembers, getProducts } from "@/lib/db";
import { formatCurrency, formatEventDate, formatEventTime, initials } from "@/lib/format";

type View = "overview" | "members" | "registrations" | "events" | "attendance" | "activity" | "announcements" | "products";
const navItems = [
  { view: "overview", label: "Overview", icon: LayoutDashboard },
  { view: "members", label: "Members", icon: Users },
  { view: "registrations", label: "Registrations", icon: ClipboardList },
  { view: "events", label: "Events", icon: CalendarDays },
  { view: "attendance", label: "Attendance", icon: UserCheck },
  { view: "activity", label: "Activity log", icon: ScrollText },
  { view: "announcements", label: "Announcements", icon: BellRing },
  { view: "products", label: "Products", icon: Package },
] as const;

export const metadata = { title: "Admin Dashboard" };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ view?: string; saved?: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const params = await searchParams;
  const allowed = navItems.map((item) => item.view);
  const view = (allowed.includes(params.view as View) ? params.view : "overview") as View;
  const [stats, members, events, attendance, announcements, products, registrations, activityLogs] = await Promise.all([
    getDashboardStats(), getMembers(), getEvents(true), getAllAttendance(), getAnnouncements(50), getProducts(false), getEventRegistrations(), getActivityLogs(),
  ]);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Brand inverse />
        <nav>
          {navItems.map(({ view: itemView, label, icon: Icon }) => <Link key={itemView} href={`/admin?view=${itemView}`} className={view === itemView ? "active" : ""}><Icon size={18} />{label}</Link>)}
          <Link href="/admin/database"><Database size={18} />Database</Link>
        </nav>
        <div className="admin-sidebar-bottom"><Link href="/">View club website</Link><form action={adminLogoutAction}><button><LogOut size={17} />Sign out</button></form></div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar"><div><p className="eyebrow">WLHL operations</p><h1>{navItems.find((item) => item.view === view)?.label}</h1></div><div className="admin-date">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div></header>
        {params.saved && <div className="saved-toast"><CheckCircle2 size={17} />{params.saved}</div>}

        {view === "overview" && (
          <>
            <section className="admin-stat-grid">
              <article><span><Users size={20} /></span><small>Total members</small><strong>{stats.members}</strong><p>{stats.active_members} active</p></article>
              <article><span><CalendarDays size={20} /></span><small>Upcoming events</small><strong>{stats.upcoming_events}</strong><p>On the calendar</p></article>
              <article><span><UserCheck size={20} /></span><small>Completed check-ins</small><strong>{stats.check_ins}</strong><p>All time</p></article>
              <article><span><ClipboardList size={20} /></span><small>Event registrations</small><strong>{stats.registrations}</strong><p>All public signups</p></article>
            </section>
            <div className="admin-two-col">
              <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Newest members</h2><p>Latest club applications</p></div><Link href="/admin?view=members">View all</Link></div><div className="mini-member-list">{members.slice(0, 5).map((member) => <div key={member.id}><span className="member-avatar">{initials(member.first_name, member.last_name)}</span><p><strong>{member.first_name} {member.last_name}</strong><small>{member.email}</small></p><span className={`table-status status-${member.membership_status}`}>{member.membership_status}</span></div>)}{members.length === 0 && <p className="admin-empty">New applications will appear here.</p>}</div></section>
              <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Next events</h2><p>Upcoming schedule</p></div><Link href="/admin?view=events">Manage</Link></div><div className="mini-event-list">{events.filter((event) => event.status === "upcoming").slice(0, 4).map((event) => <div key={event.id}><span><strong>{new Date(event.event_date).toLocaleDateString("en-US", { timeZone: "America/New_York", day: "2-digit" })}</strong><small>{new Date(event.event_date).toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short" })}</small></span><p><strong>{event.title}</strong><small>{formatEventTime(event.event_date)} · {event.location}</small></p><b>{event.attendee_count || 0}/{event.capacity}</b></div>)}</div></section>
            </div>
          </>
        )}

        {view === "members" && (
          <section className="admin-panel full-panel">
            <div className="admin-panel-heading"><div><h2>Member directory</h2><p>{members.length} people in your club database</p></div><a className="button button-outline button-small" href="/api/admin/export"><Download size={15} />Export CSV</a></div>
            <div className="table-wrap"><table><thead><tr><th>Member</th><th>Phone</th><th>Tier</th><th>Interests</th><th>Joined</th><th>Updates</th><th>Status</th><th>Profile</th></tr></thead><tbody>{members.map((member) => <tr key={member.id}><td><div className="table-person"><span className="member-avatar">{initials(member.first_name, member.last_name)}</span><p><strong>{member.first_name} {member.last_name}</strong><small>{member.email}</small></p></div></td><td>{member.phone}</td><td>{member.membership_tier}</td><td className="truncate-cell">{member.interests || "—"}</td><td>{new Date(member.joined_at).toLocaleDateString()}</td><td>{member.email_opt_in ? "Email" : "—"}{member.sms_opt_in ? " + SMS" : ""}</td><td><form action={updateMemberStatusAction} className="inline-form"><input type="hidden" name="memberId" value={member.id} /><select name="status" defaultValue={member.membership_status} aria-label={`Status for ${member.first_name}`}><option value="pending">Pending</option><option value="active">Active</option><option value="paused">Paused</option></select><button>Save</button></form></td><td><Link className="profile-link" href={`/admin/members/${member.id}`}><Eye size={14} />View</Link></td></tr>)}</tbody></table></div>
            {members.length === 0 && <p className="admin-empty">Membership applications will appear here.</p>}
          </section>
        )}

        {view === "registrations" && (
          <section className="admin-panel full-panel">
            <div className="admin-panel-heading"><div><h2>Event registrations</h2><p>{registrations.length} registration records with submitted attendee details</p></div><Link className="button button-outline button-small" href="/events/ai-health-wealth-forum">Open public page</Link></div>
            <div className="table-wrap"><table><thead><tr><th>Registrant</th><th>Event</th><th>Organization / role</th><th>Language</th><th>Registered</th><th>Updates</th><th>Status</th><th>Profile</th></tr></thead><tbody>{registrations.map((registration) => <tr key={registration.id}><td><div className="table-person"><span className="member-avatar">{initials(registration.first_name, registration.last_name)}</span><p><strong>{registration.first_name} {registration.last_name}</strong><small>{registration.email} · {registration.phone}</small></p></div></td><td><strong className="table-primary">{registration.event_title}</strong><br /><small>{registration.event_date ? formatEventDate(registration.event_date, true) : ""}</small></td><td><strong className="table-primary">{registration.organization || "—"}</strong><br /><small>{registration.job_title || "No role provided"}</small></td><td>{registration.language_preference}</td><td>{new Date(registration.created_at).toLocaleString()}</td><td>{registration.marketing_opt_in ? "Opted in" : "Event only"}</td><td><span className={`table-status attendance-${registration.status}`}>{registration.status}</span></td><td>{registration.member_id && <Link className="profile-link" href={`/admin/members/${registration.member_id}`}><Eye size={14} />View</Link>}</td></tr>)}</tbody></table></div>
            {registrations.length === 0 && <p className="admin-empty">Public event registrations will appear here.</p>}
          </section>
        )}

        {view === "events" && (
          <div className="admin-two-col admin-editor-grid">
            <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Event calendar</h2><p>Upcoming and completed events</p></div></div><div className="manage-list">{events.map((event) => <article key={event.id}><div className="manage-date"><strong>{new Date(event.event_date).toLocaleDateString("en-US", { timeZone: "America/New_York", day: "2-digit" })}</strong><span>{new Date(event.event_date).toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short" })}</span></div><div><small>{event.category}</small><h3>{event.title}</h3><p>{formatEventDate(event.event_date)} at {formatEventTime(event.event_date)} · {event.location}</p></div><b>{event.attendee_count || 0}/{event.capacity}</b></article>)}</div></section>
            <section className="admin-panel editor-panel"><span className="editor-icon"><Plus size={20} /></span><h2>Add an event</h2><p>Publish a new experience to the club calendar.</p><form action={createEventAction} className="stack-form"><label>Event title<input name="title" required /></label><label>Description<textarea name="description" rows={4} required /></label><div className="form-row two-columns"><label>Date & time<input name="eventDate" type="datetime-local" required /></label><label>Capacity<input name="capacity" type="number" defaultValue={30} min={1} required /></label></div><label>Location<input name="location" required /></label><label>Category<select name="category"><option>Movement</option><option>Nutrition</option><option>Community</option><option>Mindfulness</option><option>Education</option></select></label><button className="button button-dark button-full">Create event</button></form></section>
          </div>
        )}

        {view === "attendance" && (
          <div className="admin-two-col admin-editor-grid">
            <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Attendance log</h2><p>Registration and completion history</p></div></div><div className="attendance-list">{attendance.map((item) => <div key={item.id}><span className="member-avatar">{initials(item.first_name || "?", item.last_name || "?")}</span><p><strong>{item.first_name} {item.last_name}</strong><small>{item.event_title} · {item.event_date ? formatEventDate(item.event_date) : ""}</small></p><span className={`table-status attendance-${item.status}`}>{item.status}</span></div>)}{attendance.length === 0 && <p className="admin-empty">Reservations and check-ins will appear here.</p>}</div></section>
            <section className="admin-panel editor-panel"><span className="editor-icon"><UserCheck size={20} /></span><h2>Record attendance</h2><p>Register, check in, or mark an event completed.</p><form action={recordAttendanceAction} className="stack-form"><label>Member<select name="memberId" required defaultValue=""><option value="" disabled>Select a member</option>{members.map((member) => <option key={member.id} value={member.id}>{member.first_name} {member.last_name}</option>)}</select></label><label>Event<select name="eventId" required defaultValue=""><option value="" disabled>Select an event</option>{events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select></label><label>Status<select name="status"><option value="registered">Registered</option><option value="attended">Attended</option><option value="completed">Completed</option></select></label><button className="button button-dark button-full">Save attendance</button></form></section>
          </div>
        )}

        {view === "activity" && (
          <section className="admin-panel full-panel">
            <div className="admin-panel-heading"><div><h2>Member and admin activity</h2><p>{activityLogs.length} most recent audit and engagement records</p></div></div>
            <div className="table-wrap"><table><thead><tr><th>Date and time</th><th>Member</th><th>Activity</th><th>Event</th><th>Actor</th><th>Description</th></tr></thead><tbody>{activityLogs.map((log) => <tr key={log.id}><td>{new Date(log.created_at).toLocaleString()}</td><td>{log.member_id ? <Link className="table-primary" href={`/admin/members/${log.member_id}`}>{log.first_name} {log.last_name}</Link> : "—"}</td><td><span className="activity-type">{log.activity_type.replaceAll("_", " ")}</span></td><td>{log.event_title || "—"}</td><td><span className={`actor-chip actor-${log.actor_type}`}>{log.actor_type}</span></td><td className="log-description">{log.description}</td></tr>)}</tbody></table></div>
            {activityLogs.length === 0 && <p className="admin-empty">Member and administrative activity will be recorded here.</p>}
          </section>
        )}

        {view === "announcements" && (
          <div className="admin-two-col admin-editor-grid">
            <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Published announcements</h2><p>Member news and promotions</p></div></div><div className="announcement-admin-list">{announcements.map((item) => <article key={item.id}><span className={`news-kind news-${item.kind}`}>{item.kind}</span><h3>{item.title}</h3><p>{item.message}</p><small>{new Date(item.published_at).toLocaleDateString()} {item.featured ? "· Featured" : ""}</small></article>)}</div></section>
            <section className="admin-panel editor-panel"><span className="editor-icon"><BellRing size={20} /></span><h2>Publish an announcement</h2><p>Members with browser notifications enabled will receive this instantly.</p><form action={createAnnouncementAction} className="stack-form"><label>Headline<input name="title" required /></label><label>Message<textarea name="message" rows={5} required /></label><label>Type<select name="kind"><option value="community">Community</option><option value="event">Event</option><option value="promotion">Promotion</option></select></label><label className="check-line"><input type="checkbox" name="featured" /> <span>Feature on the home page</span></label><button className="button button-dark button-full">Publish now</button></form></section>
          </div>
        )}

        {view === "products" && (
          <div className="admin-two-col admin-editor-grid">
            <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Wellness products</h2><p>Items advertised on the club website</p></div></div><div className="manage-product-list">{products.map((product) => <article key={product.id}><span><Package size={20} /></span><div><small>{product.category}</small><h3>{product.name}</h3><p>{formatCurrency(Number(product.price))} · {product.badge || "Standard item"}</p></div><form action={toggleProductAction}><input type="hidden" name="productId" value={product.id} /><button className={`table-status ${product.active ? "status-active" : "status-paused"}`}>{product.active ? "Active" : "Hidden"}</button></form></article>)}</div></section>
            <section className="admin-panel editor-panel"><span className="editor-icon"><Package size={20} /></span><h2>Add a product</h2><p>Promote a new club-selected wellness item.</p><form action={createProductAction} className="stack-form"><label>Product name<input name="name" required /></label><label>Description<textarea name="description" rows={4} required /></label><div className="form-row two-columns"><label>Price<input name="price" type="number" step="0.01" min="0" required /></label><label>Category<input name="category" required /></label></div><label>Badge <span className="label-note">Optional</span><input name="badge" placeholder="New, Member favorite…" /></label><button className="button button-dark button-full">Add product</button></form></section>
          </div>
        )}
      </main>
    </div>
  );
}
