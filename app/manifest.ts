import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chinese American United Chamber of Commerce",
    short_name: "CAUCC",
    description: "Events, announcements, and membership for the CAUCC community.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f3ea",
    theme_color: "#173f35",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
