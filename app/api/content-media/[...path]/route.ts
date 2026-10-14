import { isContentMediaPath } from "@/lib/content-media";

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const pathname = `/${path.join("/")}`;
  if (!isContentMediaPath(pathname)) return new Response(null, { status: 404 });
  const base = process.env.FUINT_API_URL || process.env.NEXT_PUBLIC_FUINT_API || "https://parsley-easiest-qualify.ngrok-free.dev";
  const url = new URL(pathname, base);
  url.search = new URL(request.url).search;
  try {
    const response = await fetch(url, {
      headers: { "ngrok-skip-browser-warning": "true", ...(request.headers.get("range") ? { Range: request.headers.get("range")! } : {}) },
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
    const type = response.headers.get("content-type") || "";
    if (!response.ok || !/^(image|video)\//.test(type)) return new Response(null, { status: response.status === 404 ? 404 : 502 });
    const headers = new Headers({
      "Content-Type": type,
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    });
    for (const name of ["content-length", "content-range", "accept-ranges", "etag"]) {
      const value = response.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(response.body, { status: response.status, headers });
  } catch {
    return new Response(null, { status: 502 });
  }
}
