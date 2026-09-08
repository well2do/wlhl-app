"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import type { PDFDocumentProxy, RenderTask, TextLayer } from "pdfjs-dist";
import styles from "./pdf-reader.module.css";

export type PdfEngine = typeof import("pdfjs-dist");

export function PdfPage({ pdf, engine, pageNumber, zoom, rotation, availableWidth, onScaleChange }: {
  pdf: PDFDocumentProxy;
  engine: PdfEngine;
  pageNumber: number;
  zoom: number | "fit";
  rotation: number;
  availableWidth: number;
  onScaleChange: (scale: number) => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [rendering, setRendering] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const container = frame.current;
    if (!container) return;
    let cancelled = false;
    let renderTask: RenderTask | undefined;
    let textLayer: TextLayer | undefined;
    setRendering(true);
    setError("");
    container.replaceChildren();

    async function render() {
      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;
        const pageRotation = (page.rotate + rotation) % 360;
        const baseViewport = page.getViewport({ scale: 1, rotation: pageRotation });
        const scale = zoom === "fit" ? availableWidth / baseViewport.width : zoom;
        onScaleChange(scale);
        const viewport = page.getViewport({ scale, rotation: pageRotation });
        // Bound the backing canvas size while preserving the selected display size.
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2,
          Math.sqrt(16_000_000 / (viewport.width * viewport.height)),
          8192 / Math.max(viewport.width, viewport.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.floor(viewport.width * pixelRatio));
        canvas.height = Math.max(1, Math.floor(viewport.height * pixelRatio));
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        canvas.style.display = "block";
        canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", `Page ${pageNumber} of ${pdf.numPages}`);
        container!.style.width = `${viewport.width}px`;
        container!.style.height = `${viewport.height}px`;
        renderTask = page.render({
          canvas,
          viewport,
          transform: [pixelRatio, 0, 0, pixelRatio, 0, 0],
          // Existing annotations and form values are painted, with no editable fields.
          annotationMode: engine.AnnotationMode.ENABLE,
          isEditing: false,
        });
        await renderTask.promise;
        if (cancelled) return;
        container!.append(canvas);
        setRendering(false);

        const textContainer = document.createElement("div");
        textContainer.className = styles.textLayer;
        textContainer.style.setProperty("--total-scale-factor", String(viewport.scale * viewport.userUnit));
        textContainer.style.setProperty("--scale-round-x", "1px");
        textContainer.style.setProperty("--scale-round-y", "1px");
        textLayer = new engine.TextLayer({
          textContentSource: page.streamTextContent(),
          container: textContainer,
          viewport,
        });
        // Text selection is optional; a text extraction failure must not hide the page.
        try {
          await textLayer.render();
          if (!cancelled) container!.append(textContainer);
        } catch { /* The rendered page remains readable for image-only or unusual PDFs. */ }
      } catch (cause) {
        if (!cancelled && !(cause instanceof engine.RenderingCancelledException)) {
          setError("This page could not be displayed. Try another page or reopen the PDF.");
          setRendering(false);
        }
      }
    }
    void render();
    return () => {
      cancelled = true;
      renderTask?.cancel();
      textLayer?.cancel();
      container.replaceChildren();
    };
  }, [pdf, engine, pageNumber, zoom, rotation, availableWidth, onScaleChange]);

  return (
    <div className={styles.pageFrame} aria-busy={rendering}>
      <div ref={frame} />
      {rendering && <div className={styles.pageLoading} role="status"><LoaderCircle className={styles.spinner} size={22} /><span>Rendering page…</span></div>}
      {error && <p className={styles.errorBanner} role="alert">{error}</p>}
    </div>
  );
}
