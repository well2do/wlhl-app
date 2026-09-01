"use client";

import Image from "next/image";
import { Expand, ExternalLink, X } from "lucide-react";
import { useRef } from "react";

export function PosterLightbox({ locale = "en" }: { locale?: "en" | "cn" }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cn = locale === "cn";

  function openLightbox() {
    dialogRef.current?.showModal();
  }

  function closeLightbox() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        className="forum-poster-button"
        onClick={openLightbox}
        aria-label={cn ? "打开活动海报高清大图" : "Open a high-resolution view of the event poster"}
      >
        <Image
          src="/268.jpg"
          width={1280}
          height={1934}
          priority
          quality={90}
          alt="September 7 AI, Health and Wealth Legacy Forum event poster"
        />
        <span className="forum-poster-expand"><Expand size={16} />{cn ? "点击查看高清大图" : "View high-resolution poster"}</span>
      </button>

      <dialog
        ref={dialogRef}
        className="poster-lightbox"
        aria-label={cn ? "活动海报高清大图" : "High-resolution event poster"}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeLightbox();
        }}
      >
        <div className="poster-lightbox-toolbar">
          <a href="/268.jpg" target="_blank" rel="noreferrer">
            <ExternalLink size={16} />{cn ? "在新窗口打开原图" : "Open original image"}
          </a>
          <button type="button" onClick={closeLightbox} aria-label={cn ? "关闭海报大图" : "Close poster preview"}><X size={22} /></button>
        </div>
        <Image
          src="/268.jpg"
          width={1280}
          height={1934}
          quality={100}
          sizes="(max-width: 900px) 96vw, 1280px"
          alt="September 7 AI, Health and Wealth Legacy Forum event poster, high-resolution view"
        />
      </dialog>
    </>
  );
}
