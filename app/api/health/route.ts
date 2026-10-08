import { execute } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    await execute("SELECT 1");
    return Response.json({ status: "ok", database: "connected" }, { headers });
  } catch {
    return Response.json({ status: "error", database: "unavailable" }, { status: 503, headers });
  }
}
