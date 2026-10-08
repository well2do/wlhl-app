export function databaseConfig(env: Record<string, string | undefined> = process.env) {
  const url = env.TURSO_DATABASE_URL?.trim();
  const authToken = env.TURSO_AUTH_TOKEN?.trim();
  const onVercel = env.VERCEL === "1";

  if (!url) {
    if (onVercel || authToken) throw new Error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN for the remote database.");
    return { url: "file:data/wlhl.db" };
  }

  if (url.includes("your-database") || authToken === "your-turso-auth-token") {
    throw new Error("Replace the Turso example values, or leave both empty for local development.");
  }

  const protocol = new URL(url).protocol;
  if (protocol === "file:") {
    if (onVercel) throw new Error("Vercel requires a remote database; local SQLite files are not persistent.");
    return { url };
  }

  if (!["libsql:", "https:", "http:"].includes(protocol)) {
    throw new Error("Use a libsql, HTTPS, HTTP, or local file database URL.");
  }
  if (!authToken) throw new Error("Set TURSO_AUTH_TOKEN for the remote database.");
  return { url, authToken };
}
