"use client";

import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export function Lightbox({
  images,
  index,
  onClose,
  onNavigate,
}: {
  images: { url: string; caption?: string }[];
  index: number;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  const total = images.length;

  const prev = useCallback(() => onNavigate((index - 1 + total) % total), [index, total, onNavigate]);
  const next = useCallback(() => onNavigate((index + 1) % total), [index, total, onNavigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  const img = images[index];
  if (!img) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col bg-navy-950/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-xs tracking-brand uppercase text-gold-400">
          {index + 1} / {total}
        </p>
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center border border-ivory/25 text-ivory hover:bg-ivory/10 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div
        className="relative flex-1 flex items-center justify-center px-4 pb-4"
        onClick={(e) => e.stopPropagation()}
      >
        { }
        <img
          key={img.url}
          src={img.url}
          alt={img.caption || "Gallery image"}
          className="max-h-full max-w-full object-contain fade-up"
        />
        {total > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center border border-ivory/25 bg-navy-950/50 text-ivory hover:bg-ivory hover:text-navy-950 transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center border border-ivory/25 bg-navy-950/50 text-ivory hover:bg-ivory hover:text-navy-950 transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {img.caption && (
        <p className="pb-6 text-center text-sm text-ivory/80 px-6" onClick={(e) => e.stopPropagation()}>
          {img.caption}
        </p>
      )}
    </div>
  );
}
