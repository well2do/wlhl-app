import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: { default: "WLHL | Washington Longevity Healthy Life Club", template: "%s | WLHL" },
  description: "Washington, D.C.'s community for movement, wellness, healthy aging, and meaningful connection.",
  applicationName: "WLHL Healthy Life Club",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#d9ecff", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Public pages read editable database content and must use the runtime database.
  await connection();
  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable}`}>{children}</body>
    </html>
  );
}
