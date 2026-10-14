const mediaPath = /^\/static\/(?:uploadFiles|uploadImages|defaultImage)\/[A-Za-z0-9_./-]+\.(?:png|jpe?g|gif|webp|bmp|svg|mp4|mov|m4v|webm)$/i;

export function isContentMediaPath(path: string) {
  return mediaPath.test(path) && !path.split("/").some((part) => part === "." || part === "..");
}

export function contentMediaUrl(value: string, upstream = process.env.FUINT_API_URL || process.env.NEXT_PUBLIC_FUINT_API || "https://parsley-easiest-qualify.ngrok-free.dev") {
  if (!value) return "";
  try {
    const url = new URL(value, "https://wlhl.vercel.app");
    const trusted = ["wlhl.vercel.app", "localhost", "127.0.0.1", new URL(upstream).hostname];
    if (trusted.includes(url.hostname) && isContentMediaPath(url.pathname)) {
      return `/api/content-media${url.pathname}${url.search}`;
    }
    if (value.startsWith("/api/content-media/static/") && isContentMediaPath(url.pathname.replace("/api/content-media", ""))) return value;
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}
