import { execute } from "./db";

const DATABASE_PAGE_SIZE = 100;

const preferredTableOrder = [
  "members",
  "events",
  "event_registrations",
  "attendance",
  "activity_logs",
  "announcements",
  "products",
  "push_subscriptions",
] as const;

export type DatabaseTableSummary = {
  name: string;
  rowCount: number;
};

export type DatabaseColumn = {
  name: string;
  declaredType: string;
  notNull: boolean;
  primaryKeyPosition: number;
};

export type DatabaseCell = {
  storageClass: "null" | "integer" | "real" | "text" | "blob";
  value: string | null;
};

export type DatabaseTablePage = {
  tables: DatabaseTableSummary[];
  selectedTable: string | null;
  columns: DatabaseColumn[];
  rows: DatabaseCell[][];
  page: number;
  pageSize: number;
  totalPages: number;
  totalRows: number;
};

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function tableOrder(name: string) {
  const preferredIndex = preferredTableOrder.indexOf(name as (typeof preferredTableOrder)[number]);
  return preferredIndex === -1 ? preferredTableOrder.length : preferredIndex;
}

function stringifyDatabaseValue(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof ArrayBuffer) return String(value.byteLength);
  return String(value);
}

/**
 * Returns a read-only, paginated view of an application table.
 *
 * The requested table name is never used until it exactly matches a table
 * discovered from sqlite_schema, and every SQL identifier is quoted.
 */
export async function getDatabaseTablePage(
  requestedTable?: string,
  requestedPage = 1,
): Promise<DatabaseTablePage> {
  const discovered = await execute(
    `SELECT name FROM sqlite_schema
     WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
     ORDER BY name ASC`,
  );

  const tableNames = discovered.rows
    .map((row) => String(row.name))
    .sort((left, right) => tableOrder(left) - tableOrder(right) || left.localeCompare(right));

  const tables = await Promise.all(
    tableNames.map(async (name) => {
      const result = await execute(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(name)}`);
      return { name, rowCount: Number(result.rows[0]?.count || 0) };
    }),
  );

  const selectedTable = requestedTable && tableNames.includes(requestedTable)
    ? requestedTable
    : tableNames.includes("members")
      ? "members"
      : tableNames[0] || null;

  if (!selectedTable) {
    return {
      tables,
      selectedTable: null,
      columns: [],
      rows: [],
      page: 1,
      pageSize: DATABASE_PAGE_SIZE,
      totalPages: 1,
      totalRows: 0,
    };
  }

  // selectedTable is an exact match from sqlite_schema before interpolation.
  const quotedTable = quoteIdentifier(selectedTable);
  const schema = await execute(`PRAGMA table_info(${quotedTable})`);
  const columns: DatabaseColumn[] = schema.rows.map((row) => ({
    name: String(row.name),
    declaredType: String(row.type || "ANY"),
    notNull: Number(row.notnull) === 1,
    primaryKeyPosition: Number(row.pk || 0),
  }));

  const totalRows = tables.find((table) => table.name === selectedTable)?.rowCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalRows / DATABASE_PAGE_SIZE));
  const normalizedPage = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const page = Math.min(normalizedPage, totalPages);
  const offset = (page - 1) * DATABASE_PAGE_SIZE;

  const projection = columns.flatMap((column, index) => {
    const quotedColumn = quoteIdentifier(column.name);
    const typeAlias = quoteIdentifier(`__database_type_${index}`);
    const valueAlias = quoteIdentifier(`__database_value_${index}`);
    return [
      `typeof(${quotedColumn}) AS ${typeAlias}`,
      `CASE WHEN typeof(${quotedColumn}) = 'blob' THEN length(${quotedColumn}) ELSE ${quotedColumn} END AS ${valueAlias}`,
    ];
  }).join(", ");

  const primaryKeyColumns = columns
    .filter((column) => column.primaryKeyPosition > 0)
    .sort((left, right) => left.primaryKeyPosition - right.primaryKeyPosition);
  const orderBy = primaryKeyColumns.length > 0
    ? ` ORDER BY ${primaryKeyColumns.map((column) => quoteIdentifier(column.name)).join(", ")}`
    : " ORDER BY rowid";

  const result = await execute(
    `SELECT ${projection} FROM ${quotedTable}${orderBy} LIMIT ? OFFSET ?`,
    [DATABASE_PAGE_SIZE, offset],
  );

  const rows = result.rows.map((row) => columns.map((_, index) => {
    const storageClass = String(row[`__database_type_${index}`]) as DatabaseCell["storageClass"];
    const value = stringifyDatabaseValue(row[`__database_value_${index}`]);
    return { storageClass, value };
  }));

  return {
    tables,
    selectedTable,
    columns,
    rows,
    page,
    pageSize: DATABASE_PAGE_SIZE,
    totalPages,
    totalRows,
  };
}
