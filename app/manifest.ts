import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Washington Longevity Healthy Life Club",
    short_name: "WLHL",
    description: "Events, announcements, and membership for the WLHL community.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f3ea",
    theme_color: "#173f35",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
