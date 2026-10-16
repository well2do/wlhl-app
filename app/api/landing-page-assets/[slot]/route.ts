import { execute } from "@/lib/db";
import { isAllowedLandingImageSlot } from "@/lib/landing-page-content";
import { canManageEvent, getEventManager } from "@/lib/event-manager-auth";

export async function GET(_request: Request, { params }: { params: Promise<{ slot: string }> }) {
  const { slot } = await params;
  if (!isAllowedLandingImageSlot(slot)) return new Response("Not found", { status: 404 });
  let privateImage = false;
  if (slot.startsWith("event-")) {
    const event = await execute("SELECT e.status, m.merchant_id, m.store_id FROM events e LEFT JOIN event_management m ON m.event_id = e.id WHERE e.id = ?", [slot.slice(6)]);
    if (event.rows[0]?.status === "draft") {
      const manager = await getEventManager();
      if (!manager || !canManageEvent(manager, { merchant_id: event.rows[0].merchant_id, store_id: event.rows[0].store_id })) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
      privateImage = true;
    }
  }

  const result = await execute(
    "SELECT mime_type, data, updated_at FROM landing_page_assets WHERE slot = ? LIMIT 1",
    [slot],
  );
  const row = result.rows[0];
  if (!row) return new Response("Not found", { status: 404 });

  const stored = row.data;
  const bytes = stored instanceof ArrayBuffer
    ? new Uint8Array(stored)
    : ArrayBuffer.isView(stored)
      ? new Uint8Array(stored.buffer, stored.byteOffset, stored.byteLength)
      : null;
  if (!bytes) return new Response("Not found", { status: 404 });

  const body = Uint8Array.from(bytes).buffer;

  return new Response(body, {
    headers: {
      "Cache-Control": privateImage ? "private, no-store" : "public, max-age=31536000, immutable",
      "Content-Type": String(row.mime_type),
      ETag: `"${String(row.updated_at)}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
