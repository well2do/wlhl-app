import { execute } from "@/lib/db";
import { isAllowedLandingImageSlot } from "@/lib/landing-page-content";

export async function GET(_request: Request, { params }: { params: Promise<{ slot: string }> }) {
  const { slot } = await params;
  if (!isAllowedLandingImageSlot(slot)) return new Response("Not found", { status: 404 });

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
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": String(row.mime_type),
      ETag: `"${String(row.updated_at)}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
