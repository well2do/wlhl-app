"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight,
  FileText, FolderOpen, HardDrive, Leaf, LoaderCircle, LockKeyhole, Maximize,
  Minus, Plus, RotateCw, ShieldCheck, Unplug, X,
} from "lucide-react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist";
import { PdfPage, type PdfEngine } from "./pdf-page";
import { PdfPrintButton } from "./pdf-print-button";
import styles from "./pdf-reader.module.css";

type OpenDocument = { pdf: PDFDocumentProxy; engine: PdfEngine; name: string; size: number };
type PasswordRequest = { update: (password: string) => void; incorrect: boolean };
type FileLaunch = { files?: readonly Pick<FileSystemFileHandle, "getFile">[] };
type FileLaunchWindow = Window & {
  launchQueue?: { setConsumer: (consumer: (launch: FileLaunch) => void) => void };
};
const MAX_FILE_SIZE = 100 * 1024 * 1024;

function fileSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function PdfReader() {
  const [opened, setOpened] = useState<OpenDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [zoom, setZoom] = useState<number | "fit">("fit");
  const [rotation, setRotation] = useState(0);
  const [availableWidth, setAvailableWidth] = useState(800);
  const [dragging, setDragging] = useState(false);
  const [passwordRequest, setPasswordRequest] = useState<PasswordRequest | null>(null);
  const [password, setPassword] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const app = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const loadingTask = useRef<PDFDocumentLoadingTask | null>(null);
  const requestId = useRef(0);
  const dragDepth = useRef(0);
  const renderedScale = useRef(1);
  const onScaleChange = useCallback((scale: number) => { renderedScale.current = scale; }, []);

  const closeDocument = useCallback(() => {
    requestId.current += 1;
    const previous = loadingTask.current;
    loadingTask.current = null;
    setOpened(null);
    setLoading(false);
    setPasswordRequest(null);
    setPassword("");
    setError("");
    void previous?.destroy().catch(() => {});
  }, []);

  useEffect(() => () => {
    requestId.current += 1;
    void loadingTask.current?.destroy().catch(() => {});
  }, []);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setAvailableWidth(Math.max(100, entry.contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [opened]);

  useEffect(() => {
    if (passwordRequest) {
      if (!dialog.current?.open) dialog.current?.showModal();
    } else {
      dialog.current?.close();
    }
  }, [passwordRequest]);

  const openFile = useCallback(async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      setError("Choose a PDF document (.pdf) to start reading.");
      return;
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      setError(file.size === 0 ? "This file is empty. Choose another PDF." : "Choose a PDF smaller than 100 MB.");
      return;
    }

    const id = ++requestId.current;
    const previous = loadingTask.current;
    loadingTask.current = null;
    setOpened(null);
    setLoading(true);
    setError("");
    setPasswordRequest(null);
    setPassword("");
    try {
      await previous?.destroy();
      const [engine, buffer] = await Promise.all([import("pdfjs-dist"), file.arrayBuffer()]);
      if (id !== requestId.current) return;
      const assets = `/pdfread-assets/${engine.version}/`;
      engine.GlobalWorkerOptions.workerSrc = `${assets}pdf.worker.min.mjs`;
      const task = engine.getDocument({
        data: new Uint8Array(buffer),
        cMapUrl: `${assets}cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `${assets}standard_fonts/`,
        wasmUrl: `${assets}wasm/`,
        iccUrl: `${assets}iccs/`,
      });
      loadingTask.current = task;
      task.onPassword = (update: (value: string) => void, reason: number) => {
        if (id !== requestId.current) return;
        setPassword("");
        setPasswordRequest({ update, incorrect: reason === engine.PasswordResponses.INCORRECT_PASSWORD });
      };
      const pdf = await task.promise;
      if (id !== requestId.current) return;
      setPasswordRequest(null);
      setPassword("");
      setPageNumber(1);
      setPageInput("1");
      setZoom("fit");
      setRotation(0);
      setOpened({ pdf, engine, name: file.name, size: file.size });
    } catch {
      if (id !== requestId.current) return;
      setPasswordRequest(null);
      setPassword("");
      setError("This PDF could not be opened. It may be damaged or use an unsupported format. Please try another file.");
      const failed = loadingTask.current;
      loadingTask.current = null;
      void failed?.destroy().catch(() => {});
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const queue = (window as FileLaunchWindow).launchQueue;
    if (!queue) return;
    let active = true;
    let latestLaunch = 0;

    queue.setConsumer(async ({ files }) => {
      if (!files?.length) return;
      const launch = ++latestLaunch;
      const currentRequest = requestId.current;
      if (files.length > 1) {
        setError("Please open one PDF at a time.");
        return;
      }
      try {
        // Read the file supplied by the operating system without requesting write access.
        const file = await files[0].getFile();
        if (active && launch === latestLaunch && currentRequest === requestId.current) {
          await openFile(file);
        }
      } catch {
        if (active && launch === latestLaunch && currentRequest === requestId.current) {
          setError("This file could not be read. Click Open PDF to choose it again.");
        }
      }
    });

    return () => {
      active = false;
      queue.setConsumer(() => {});
    };
  }, [openFile]);

  const goToPage = useCallback((value: number) => {
    if (!opened) return;
    const next = Math.max(1, Math.min(opened.pdf.numPages, Math.trunc(value) || 1));
    setPageNumber(next);
    setPageInput(String(next));
    stage.current?.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [opened]);

  const changeZoom = useCallback((direction: number) => {
    setZoom((current) => {
      const scale = current === "fit" ? renderedScale.current : current;
      const step = direction > 0 ? Math.floor(scale * 4) + 1 : Math.ceil(scale * 4) - 1;
      return Math.max(0.25, Math.min(3, step / 4));
    });
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, select, button, [contenteditable=true]") || passwordRequest) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "o") {
        event.preventDefault();
        input.current?.click();
        return;
      }
      if (!opened || event.ctrlKey || event.metaKey || event.altKey) return;
      if (["ArrowLeft", "ArrowRight", "Home", "End", "+", "=", "-"].includes(event.key)) event.preventDefault();
      if (event.key === "ArrowLeft") goToPage(pageNumber - 1);
      if (event.key === "ArrowRight") goToPage(pageNumber + 1);
      if (event.key === "Home") goToPage(1);
      if (event.key === "End") goToPage(opened.pdf.numPages);
      if (event.key === "+" || event.key === "=") changeZoom(1);
      if (event.key === "-") changeZoom(-1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [opened, pageNumber, goToPage, changeZoom, passwordRequest]);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (app.current?.requestFullscreen) await app.current.requestFullscreen();
      else setError("Full screen is not available in this browser. You can still read your PDF here.");
    } catch {
      setError("Full screen could not be opened. You can still read your PDF here.");
    }
  }

  return (
    <div ref={app} className={styles.app}
      onDragEnter={(event) => { event.preventDefault(); if (event.dataTransfer.types.includes("Files")) { dragDepth.current += 1; setDragging(true); } }}
      onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }}
      onDragLeave={(event) => { event.preventDefault(); dragDepth.current = Math.max(0, dragDepth.current - 1); if (!dragDepth.current) setDragging(false); }}
      onDrop={(event) => { event.preventDefault(); dragDepth.current = 0; setDragging(false); if (event.dataTransfer.files.length > 1) setError("Please open one PDF at a time."); else void openFile(event.dataTransfer.files[0]); }}>
      <header className={styles.header}>
        <a href="/pdfread" className={styles.brand} aria-label="pdfread home">
          <span className={styles.brandIcon}><BookOpen size={24} strokeWidth={1.7} /></span>
          <span><strong className={styles.brandName}>pdfread<span>.</span></strong><small className={styles.brandCaption}>A little space to read.</small></span>
        </a>
        <div className={styles.headerActions}>
          <span className={styles.readOnlyBadge}><LockKeyhole size={13} /> Read only</span>
          <button className={styles.primaryButton} onClick={() => input.current?.click()}><FolderOpen size={17} /> Open PDF</button>
        </div>
        <input ref={input} hidden type="file" accept="application/pdf,.pdf" aria-label="Choose a PDF file" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; void openFile(file); }} />
      </header>

      {error && <div className={styles.errorBanner} role="alert"><span>{error}</span><button className={styles.iconButton} onClick={() => setError("")} aria-label="Dismiss error"><X size={17} /></button></div>}

      {opened ? <>
        <div className={styles.toolbar} aria-label="PDF reading controls">
          <div className={styles.fileDetails}><FileText size={22} /><div><strong title={opened.name}>{opened.name}</strong><small>{fileSize(opened.size)} · Local document</small></div></div>
          <div className={styles.toolbarControls}>
            <div className={styles.controlGroup}>
              <button className={styles.iconButton} onClick={() => goToPage(pageNumber - 1)} disabled={pageNumber === 1} aria-label="Previous page" title="Previous page (←)"><ChevronLeft size={18} /></button>
              <form onSubmit={(event) => { event.preventDefault(); goToPage(Number(pageInput)); }}>
                <input className={styles.pageInput} aria-label="Page number" type="number" min={1} max={opened.pdf.numPages} value={pageInput} onChange={(event) => setPageInput(event.target.value)} onBlur={() => goToPage(Number(pageInput))} />
              </form>
              <span className={styles.pageTotal}>/ {opened.pdf.numPages}</span>
              <button className={styles.iconButton} onClick={() => goToPage(pageNumber + 1)} disabled={pageNumber === opened.pdf.numPages} aria-label="Next page" title="Next page (→)"><ChevronRight size={18} /></button>
            </div>
            <span className={styles.divider} />
            <div className={styles.controlGroup}>
              <button className={styles.iconButton} onClick={() => changeZoom(-1)} disabled={zoom === 0.25} aria-label="Zoom out" title="Zoom out (-)"><Minus size={17} /></button>
              <select className={styles.zoomLabel} aria-label="Zoom level" value={zoom} onChange={(event) => setZoom(event.target.value === "fit" ? "fit" : Number(event.target.value))}>
                <option value="fit">Fit width</option>
                {Array.from({ length: 12 }, (_, index) => (index + 1) * 0.25).map((value) => <option key={value} value={value}>{Math.round(value * 100)}%</option>)}
              </select>
              <button className={styles.iconButton} onClick={() => changeZoom(1)} disabled={zoom === 3} aria-label="Zoom in" title="Zoom in (+)"><Plus size={17} /></button>
            </div>
            <span className={styles.divider} />
            <PdfPrintButton pdf={opened.pdf} engine={opened.engine} filename={opened.name} onError={setError} />
            <button className={styles.iconButton} onClick={() => setRotation((value) => (value + 90) % 360)} aria-label="Rotate clockwise" title="Rotate clockwise"><RotateCw size={17} /></button>
            <button className={styles.iconButton} onClick={() => void toggleFullscreen()} aria-label="Toggle full screen" title="Full screen"><Maximize size={17} /></button>
            <button className={styles.iconButton} onClick={closeDocument} aria-label="Close PDF" title="Close PDF"><X size={18} /></button>
          </div>
        </div>
        <main ref={stage} className={styles.stage} aria-label="PDF document">
          <PdfPage pdf={opened.pdf} engine={opened.engine} pageNumber={pageNumber} zoom={zoom} rotation={rotation} availableWidth={availableWidth} onScaleChange={onScaleChange} />
        </main>
        <footer className={styles.statusBar}>
          <span className={styles.statusLeft}><ShieldCheck size={14} /> Your original stays untouched</span>
          <span aria-live="polite">Page {pageNumber} of {opened.pdf.numPages}</span>
          <span className={styles.keyboardHint}><ArrowLeft size={12} /><ArrowRight size={12} /> to turn pages</span>
        </footer>
      </> : <main className={styles.welcome}>
        <p className={styles.eyebrow}><span /> SIMPLE. PRIVATE. READ ONLY.</p>
        <h1 className={styles.heroTitle}>Just you and<br /><em>your document.</em></h1>
        <p className={styles.heroDescription}>A quiet place for your PDFs. Open a document,<br />settle in, and leave everything else behind.</p>
        <div className={`${styles.dropzone} ${dragging ? styles.dragging : ""}`}>
          <div className={styles.paperIllustration} aria-hidden="true"><FileText size={31} strokeWidth={1.3} /><span /><span /><span /><div className={styles.paperBadge}><Check size={14} /> PDF</div></div>
          <h2 className={styles.dropTitle}>{loading ? "Opening your document…" : "Your next read starts here"}</h2>
          <p className={styles.dropDescription}>{loading ? "Getting the pages ready for you." : "Drop a PDF here, or choose one from your device."}</p>
          <button className={styles.browseButton} onClick={() => loading ? closeDocument() : input.current?.click()}>
            {loading ? <><LoaderCircle className={styles.spinner} size={18} /> Cancel opening</> : <><FolderOpen size={18} /> Choose a PDF <ArrowRight size={16} /></>}
          </button>
          <span className={styles.fileHint}>PDF files up to 100 MB</span>
        </div>
        <div className={styles.features}>
          <article><HardDrive size={20} strokeWidth={1.6} /><div><h2>Stays on your device</h2><p>Your files open locally.<br />Nothing gets uploaded.</p></div></article>
          <article><ShieldCheck size={21} strokeWidth={1.6} /><div><h2>Made for reading</h2><p>Turn pages, zoom, and explore.<br />Your original stays untouched.</p></div></article>
          <article><Unplug size={20} strokeWidth={1.6} /><div><h2>Open and go</h2><p>No account. No setup.<br />Just a document and you.</p></div></article>
        </div>
        <footer className={styles.welcomeFooter}><Leaf size={14} /> Less noise. More reading.</footer>
      </main>}

      {dragging && <div className={styles.dropOverlay} aria-hidden="true"><ArrowDownToLine size={42} /><strong>Drop your PDF to open it</strong><span>It stays on your device.</span></div>}

      <dialog ref={dialog} className={styles.dialog} aria-labelledby="password-title" onCancel={(event) => { event.preventDefault(); closeDocument(); }}>
        <span className={styles.passwordIcon}><LockKeyhole size={25} /></span>
        <h2 id="password-title">This PDF is password protected</h2>
        <p>Enter the document password to start reading.</p>
        <form onSubmit={(event) => { event.preventDefault(); passwordRequest?.update(password); setPassword(""); }}>
          <label htmlFor="pdf-password">Document password</label>
          <input id="pdf-password" className={styles.passwordField} type="password" autoComplete="off" autoFocus required value={password} onChange={(event) => setPassword(event.target.value)} aria-invalid={passwordRequest?.incorrect || undefined} aria-describedby={passwordRequest?.incorrect ? "password-error" : undefined} />
          {passwordRequest?.incorrect && <p id="password-error" role="alert">That password did not work. Please try again.</p>}
          <div className={styles.dialogActions}><button className={styles.secondaryButton} type="button" onClick={closeDocument}>Cancel</button><button className={styles.primaryButton} type="submit">Open document <ArrowRight size={16} /></button></div>
        </form>
      </dialog>
    </div>
  );
}
