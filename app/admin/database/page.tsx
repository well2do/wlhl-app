import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  CalendarDays,
  ClipboardList,
  Database,
  LayoutDashboard,
  LogOut,
  Package,
  RefreshCw,
  ScrollText,
  ShieldAlert,
  UserCheck,
  Users,
} from "lucide-react";
import { adminLogoutAction } from "@/app/actions";
import { Brand } from "@/components/brand";
import { isAdmin } from "@/lib/auth";
import { getDatabaseTablePage, type DatabaseCell } from "@/lib/database-browser";
import styles from "./database.module.css";

export const metadata = {
  title: "Database | Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const adminLinks = [
  { href: "/admin?view=overview", label: "Overview", icon: LayoutDashboard },
  { href: "/admin?view=members", label: "Members", icon: Users },
  { href: "/admin?view=registrations", label: "Registrations", icon: ClipboardList },
  { href: "/admin?view=events", label: "Events", icon: CalendarDays },
  { href: "/admin?view=attendance", label: "Attendance", icon: UserCheck },
  { href: "/admin?view=activity", label: "Activity log", icon: ScrollText },
  { href: "/admin?view=announcements", label: "Announcements", icon: BellRing },
  { href: "/admin?view=products", label: "Products", icon: Package },
] as const;

function databaseHref(table: string, page = 1) {
  const params = new URLSearchParams({ table });
  if (page > 1) params.set("page", String(page));
  return `/admin/database?${params.toString()}`;
}

function DatabaseValue({ cell }: { cell: DatabaseCell }) {
  if (cell.storageClass === "null") {
    return <span className={styles.nullValue}>NULL</span>;
  }
  if (cell.storageClass === "blob") {
    return <span className={styles.blobValue}>BLOB · {Number(cell.value || 0).toLocaleString("en-US")} bytes</span>;
  }
  if (cell.storageClass === "text" && cell.value === "") {
    return <span className={styles.emptyValue}>&quot;&quot;</span>;
  }
  return <code>{cell.value}</code>;
}

export default async function AdminDatabasePage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string; page?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  const params = await searchParams;
  const requestedPage = /^\d+$/.test(params.page || "") ? Number(params.page) : 1;
  const data = await getDatabaseTablePage(params.table, requestedPage);
  const firstRow = data.totalRows === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const lastRow = Math.min(data.page * data.pageSize, data.totalRows);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Brand inverse />
        <nav>
          {adminLinks.map(({ href, label, icon: Icon }) => (
            <Link href={href} key={href}><Icon size={18} />{label}</Link>
          ))}
          <Link href="/admin/database" className="active" aria-current="page"><Database size={18} />Database</Link>
        </nav>
        <div className="admin-sidebar-bottom">
          <Link href="/">View club website</Link>
          <form action={adminLogoutAction}><button type="submit"><LogOut size={17} />Sign out</button></form>
        </div>
      </aside>

      <main className={`admin-main ${styles.main}`}>
        <header className="admin-topbar">
          <div><p className="eyebrow">CAUCC operations</p><h1>Database</h1></div>
          <div className="admin-date">Read-only table browser</div>
        </header>

        <div className={styles.privacyNotice}>
          <ShieldAlert size={17} />
          <p><strong>Private operational data</strong><span>This read-only view includes member details and notification subscription credentials. Use it only to verify stored records.</span></p>
        </div>

        <section className={`admin-panel full-panel ${styles.panel}`}>
          <div className="admin-panel-heading">
            <div>
              <h2>Raw database tables</h2>
              <p>{data.tables.length} application tables discovered directly from the current database</p>
            </div>
            {data.selectedTable && (
              <a className="button button-outline button-small" href={databaseHref(data.selectedTable, data.page)}>
                <RefreshCw size={14} />Refresh
              </a>
            )}
          </div>

          {data.tables.length > 0 ? (
            <>
              <nav className={styles.tabs} aria-label="Database tables">
                {data.tables.map((table) => (
                  <Link
                    href={databaseHref(table.name)}
                    className={table.name === data.selectedTable ? styles.activeTab : styles.tab}
                    aria-current={table.name === data.selectedTable ? "page" : undefined}
                    key={table.name}
                  >
                    <code>{table.name}</code><span>{table.rowCount.toLocaleString("en-US")}</span>
                  </Link>
                ))}
              </nav>

              <div className={styles.tableSummary}>
                <p><Database size={16} /><strong>{data.selectedTable}</strong></p>
                <span>{data.totalRows.toLocaleString("en-US")} total rows · showing {firstRow.toLocaleString("en-US")}–{lastRow.toLocaleString("en-US")}</span>
              </div>

              <div className="table-wrap">
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {data.columns.map((column) => (
                        <th scope="col" key={column.name}>
                          <span className={styles.columnHeading}>
                            <code>{column.name}</code>
                            <small>
                              {column.declaredType}
                              {column.primaryKeyPosition > 0 ? " · PK" : ""}
                              {column.notNull ? " · NOT NULL" : ""}
                            </small>
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row, rowIndex) => (
                      <tr key={`${data.page}-${rowIndex}`}>
                        {row.map((cell, columnIndex) => (
                          <td className={styles.cell} title={`SQLite ${cell.storageClass}`} key={data.columns[columnIndex]?.name || columnIndex}>
                            <DatabaseValue cell={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.rows.length === 0 && <p className="admin-empty">This table has no rows.</p>}

              {data.totalPages > 1 && data.selectedTable && (
                <footer className={styles.pagination}>
                  {data.page > 1
                    ? <Link href={databaseHref(data.selectedTable, data.page - 1)}><ArrowLeft size={14} />Previous</Link>
                    : <span className={styles.disabledPage}><ArrowLeft size={14} />Previous</span>}
                  <p>Page <strong>{data.page}</strong> of {data.totalPages}</p>
                  {data.page < data.totalPages
                    ? <Link href={databaseHref(data.selectedTable, data.page + 1)}>Next<ArrowRight size={14} /></Link>
                    : <span className={styles.disabledPage}>Next<ArrowRight size={14} /></span>}
                </footer>
              )}
            </>
          ) : (
            <p className="admin-empty">No application tables were found in this database.</p>
          )}
        </section>
      </main>
    </div>
  );
}
