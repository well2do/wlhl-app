import type { Metadata, Viewport } from "next";
import { PdfReader } from "./pdf-reader";

export const metadata: Metadata = {
  title: { absolute: "pdfread — Your quiet place to read PDFs" },
  description: "Open and read PDF documents privately in your browser. A simple, read-only PDF reader with page navigation, zoom, and rotation.",
  applicationName: "pdfread",
  manifest: "/pdfread.webmanifest",
  icons: { icon: "/pdfread-icon.svg", apple: "/pdfread-icon.svg" },
};

export const viewport: Viewport = { themeColor: "#203d36" };

export default function PdfReadPage() {
  return <PdfReader />;
}
