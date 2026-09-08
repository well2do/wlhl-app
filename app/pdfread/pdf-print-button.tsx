"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, Printer } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { PdfEngine } from "./pdf-page";
import { preparePdfPrint, type PreparedPdfPrint } from "./pdf-print";
import styles from "./pdf-reader.module.css";

type PrintJob = { controller: AbortController; prepared?: PreparedPdfPrint; finished: boolean };
type PrintProgress = { completed: number; ready: boolean };

export function PdfPrintButton({ pdf, engine, filename, onError }: {
  pdf: PDFDocumentProxy;
  engine: PdfEngine;
  filename: string;
  onError: (message: string) => void;
}) {
  const [progress, setProgress] = useState<PrintProgress | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const job = useRef<PrintJob | null>(null);

  const cancel = useCallback(() => {
    job.current?.controller.abort();
    job.current?.prepared?.dispose();
    job.current = null;
    setProgress(null);
  }, []);

  useEffect(() => () => {
    job.current?.controller.abort();
    job.current?.prepared?.dispose();
    job.current = null;
  }, [pdf]);

  useEffect(() => {
    if (progress) {
      if (!dialog.current?.open) dialog.current?.showModal();
    } else {
      dialog.current?.close();
    }
  }, [progress]);

  const showPrintDialog = useCallback(() => {
    try {
      job.current?.prepared?.print();
    } catch {
      cancel();
      onError("The print dialog could not be opened. Please try printing again.");
    }
  }, [cancel, onError]);

  const startPrint = useCallback(async () => {
    if (job.current && !job.current.finished) return;
    // Release the previous preview only when a new print starts or the PDF closes.
    // Some browsers return from print()/afterprint while still using its images.
    cancel();
    const current: PrintJob = { controller: new AbortController(), finished: false };
    job.current = current;
    setProgress({ completed: 0, ready: false });
    try {
      const prepared = await preparePdfPrint(pdf, engine, filename, current.controller.signal, (completed) => {
        if (job.current === current) setProgress({ completed, ready: false });
      });
      if (job.current !== current) {
        prepared.dispose();
        return;
      }
      current.prepared = prepared;
      prepared.frame.contentWindow?.addEventListener("afterprint", () => {
        if (job.current !== current) return;
        current.finished = true;
        setProgress(null);
      }, { once: true });
      setProgress({ completed: pdf.numPages, ready: true });
      // A separate task lets layout and decoded images settle before native printing.
      window.setTimeout(() => {
        if (job.current === current) showPrintDialog();
      }, 0);
    } catch (error) {
      if (current.controller.signal.aborted || job.current !== current) return;
      cancel();
      onError(error instanceof Error ? error.message : "This PDF could not be prepared for printing. Please try again.");
    }
  }, [pdf, engine, filename, cancel, onError, showPrintDialog]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Handle printing even when focus is on the page input or another control.
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "p") {
        event.preventDefault();
        void startPrint();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [startPrint]);

  return <>
    <button className={styles.printButton} onClick={() => void startPrint()} disabled={progress !== null} aria-label="Print PDF" title="Print PDF (Ctrl/Cmd+P)">
      <Printer size={17} /><span>Print</span>
    </button>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="print-title" onCancel={(event) => { event.preventDefault(); cancel(); }}>
      <span className={styles.passwordIcon}>{progress?.ready ? <Printer size={25} /> : <LoaderCircle className={styles.spinner} size={25} />}</span>
      <h2 id="print-title">{progress?.ready ? "Print PDF" : "Preparing PDF for printing"}</h2>
      <p className={styles.printFilename} title={filename}>{filename}</p>
      <p role="status" aria-live="polite">{progress?.ready
        ? "Use the system dialog to choose a printer, page range, or Save as PDF. If it did not appear, open it below."
        : `Preparing page ${Math.min((progress?.completed ?? 0) + 1, pdf.numPages)} of ${pdf.numPages}…`}</p>
      {!progress?.ready && <progress className={styles.printProgress} value={progress?.completed ?? 0} max={pdf.numPages} aria-label="Pages prepared for printing" />}
      <div className={styles.dialogActions}>
        <button className={styles.secondaryButton} type="button" onClick={cancel}>{progress?.ready ? "Close" : "Cancel"}</button>
        {progress?.ready && <button className={styles.primaryButton} type="button" onClick={showPrintDialog}><Printer size={16} /> Open print dialog</button>}
      </div>
    </dialog>
  </>;
}
