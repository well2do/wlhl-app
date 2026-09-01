import Link from "next/link";
import {
  BellRing,
  CalendarDays,
  ClipboardList,
  Database,
  Image,
  LayoutDashboard,
  LogOut,
  Package,
  ScrollText,
  UserCheck,
  Users,
} from "lucide-react";
import { adminLogoutAction } from "@/app/actions";
import { Brand } from "./brand";

export const adminNavItems = [
  { id: "overview", label: "Overview", href: "/admin", icon: LayoutDashboard },
  { id: "members", label: "Members", href: "/admin?view=members", icon: Users },
  { id: "registrations", label: "Registrations", href: "/admin?view=registrations", icon: ClipboardList },
  { id: "events", label: "Events", href: "/admin?view=events", icon: CalendarDays },
  { id: "attendance", label: "Attendance", href: "/admin?view=attendance", icon: UserCheck },
  { id: "activity", label: "Activity log", href: "/admin?view=activity", icon: ScrollText },
  { id: "announcements", label: "Announcements", href: "/admin?view=announcements", icon: BellRing },
  { id: "products", label: "Products", href: "/admin?view=products", icon: Package },
  { id: "landing-page", label: "Landing page", href: "/admin/landing-page-editor", icon: Image },
  { id: "database", label: "Database", href: "/admin/database", icon: Database },
] as const;

export type AdminNavId = (typeof adminNavItems)[number]["id"];

export function AdminSidebar({ active }: { active: AdminNavId }) {
  return (
    <aside className="admin-sidebar">
      <Brand inverse />
      <nav>
        {adminNavItems.map(({ id, label, href, icon: Icon }) => (
          <Link key={id} href={href} className={active === id ? "active" : ""} aria-current={active === id ? "page" : undefined}>
            <Icon size={18} />{label}
          </Link>
        ))}
      </nav>
      <div className="admin-sidebar-bottom">
        <Link href="/">View club website</Link>
        <form action={adminLogoutAction}><button><LogOut size={17} />Sign out</button></form>
      </div>
    </aside>
  );
}
