import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Washington Longevity Healthy Life Club",
    short_name: "华盛顿长寿康养俱乐部",
    description: "Events, announcements, and membership for the Washington Longevity Health Life Club community.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f8fc",
    theme_color: "#d9ecff",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
