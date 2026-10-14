"use client";

import { createCopy, type PageCopy } from "@/lib/page-copy";

import Image from "next/image";
import { Expand, ExternalLink, X } from "lucide-react";
import { useRef } from "react";

export function PosterLightbox({ locale = "en", src = "/268.jpg", copy = {} }: { locale?: "en" | "cn"; src?: string; copy?: PageCopy }) {
  const copyText = createCopy(copy);
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
        aria-label={cn ? copyText("打开活动海报高清大图") : copyText("Open a high-resolution view of the event poster")}
      >
        <Image
          src={src}
          unoptimized={src.startsWith("/api/")}
          width={1280}
          height={1934}
          priority
          quality={90}
          alt={cn ? copyText("9月7日 AI 时代健康与财富传承论坛活动海报") : copyText("September 7 AI, Health and Wealth Legacy Forum event poster")}
        />
        <span className="forum-poster-expand"><Expand size={16} />{cn ? copyText("点击查看高清大图") : copyText("View high-resolution poster")}</span>
      </button>

      <dialog
        ref={dialogRef}
        className="poster-lightbox"
        aria-label={cn ? copyText("活动海报高清大图") : copyText("High-resolution event poster")}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeLightbox();
        }}
      >
        <div className="poster-lightbox-toolbar">
          <a href={src} target="_blank" rel="noreferrer">
            <ExternalLink size={16} />{cn ? copyText("在新窗口打开原图") : copyText("Open original image")}
          </a>
          <button type="button" onClick={closeLightbox} aria-label={cn ? copyText("关闭海报大图") : copyText("Close poster preview")}><X size={22} /></button>
        </div>
        <Image
          src={src}
          unoptimized={src.startsWith("/api/")}
          width={1280}
          height={1934}
          quality={100}
          sizes="(max-width: 900px) 96vw, 1280px"
          alt={cn ? copyText("9月7日 AI 时代健康与财富传承论坛活动海报高清大图") : copyText("September 7 AI, Health and Wealth Legacy Forum event poster, high-resolution view")}
        />
      </dialog>
    </>
  );
}
