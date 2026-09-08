import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import type { PdfEngine } from "./pdf-page";

export type PreparedPdfPrint = {
  frame: HTMLIFrameElement;
  print: () => void;
  dispose: () => void;
};

export async function preparePdfPrint(
  pdf: PDFDocumentProxy,
  engine: PdfEngine,
  filename: string,
  signal: AbortSignal,
  onProgress: (completed: number) => void,
): Promise<PreparedPdfPrint> {
  signal.throwIfAborted();
  const permissions = await pdf.getPermissions();
  signal.throwIfAborted();
  if (permissions && !permissions.has(engine.PermissionFlag.PRINT) && !permissions.has(engine.PermissionFlag.PRINT_HIGH_QUALITY)) {
    throw new Error("Printing is disabled by this PDF's permissions.");
  }

  const frame = document.createElement("iframe");
  frame.title = "PDF print document";
  frame.dataset.pdfreadPrint = "";
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  // Keep the frame laid out; display:none can produce empty output in browsers.
  frame.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none;border:0";
  document.body.append(frame);
  const objectUrls: string[] = [];
  const canvas = document.createElement("canvas");
  let renderTask: RenderTask | undefined;
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    renderTask?.cancel();
    frame.remove();
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
    canvas.width = canvas.height = 0;
    signal.removeEventListener("abort", dispose);
  };
  signal.addEventListener("abort", dispose, { once: true });

  try {
    const printDocument = frame.contentDocument;
    const printWindow = frame.contentWindow;
    if (!printDocument || !printWindow) throw new Error("The print preview could not be created. Please try again.");
    printDocument.title = filename;
    const stylesheet = printDocument.createElement("style");
    stylesheet.textContent = `
      html, body { margin: 0; padding: 0; background: white; }
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      section { margin: 0; padding: 0; overflow: hidden; break-inside: avoid; break-after: page; }
      section:last-child { break-after: auto; }
      img { display: block; width: 100%; height: 100%; }
    `;
    printDocument.head.append(stylesheet);

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      signal.throwIfAborted();
      const page = await pdf.getPage(pageNumber);
      signal.throwIfAborted();
      // Print the original page size/orientation, independent of the reading view.
      const viewport = page.getViewport({ scale: 1 });
      const ratio = Math.min(150 / 72,
        Math.sqrt(16_000_000 / (viewport.width * viewport.height)),
        8192 / Math.max(viewport.width, viewport.height));
      canvas.width = Math.max(1, Math.floor(viewport.width * ratio));
      canvas.height = Math.max(1, Math.floor(viewport.height * ratio));
      renderTask = page.render({
        canvas,
        viewport,
        transform: [ratio, 0, 0, ratio, 0, 0],
        intent: "print",
        annotationMode: engine.AnnotationMode.ENABLE,
        isEditing: false,
      });
      await renderTask.promise;
      renderTask = undefined;
      signal.throwIfAborted();
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((value) => value ? resolve(value) : reject(new Error("A page could not be prepared for printing. Please try again.")), "image/png");
      });
      signal.throwIfAborted();
      const url = URL.createObjectURL(blob);
      objectUrls.push(url);
      const image = printDocument.createElement("img");
      image.alt = `Page ${pageNumber}`;
      image.src = url;
      await image.decode();
      signal.throwIfAborted();

      const pageName = `pdfreadPage${pageNumber}`;
      const section = printDocument.createElement("section");
      section.style.cssText = `page:${pageName};width:${viewport.width}pt;height:${viewport.height}pt`;
      stylesheet.append(printDocument.createTextNode(`\n@page ${pageName} { size: ${viewport.width}pt ${viewport.height}pt; margin: 0; }`));
      section.append(image);
      printDocument.body.append(section);
      onProgress(pageNumber);
    }

    canvas.width = canvas.height = 0;
    return {
      frame,
      print: () => {
        signal.throwIfAborted();
        if (disposed) throw new Error("The print preview is closed. Please prepare it again.");
        printWindow.focus();
        printWindow.print();
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
