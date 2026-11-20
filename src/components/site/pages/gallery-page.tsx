"use client";

import { useMemo, useState } from "react";
import { type PublicContent, usePageMeta } from "@/lib/site-hooks";
import { PageHero } from "../ui-bits";
import { Lightbox } from "../lightbox";

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "ROOMS", label: "Rooms" },
  { key: "RESTAURANT", label: "Restaurant" },
  { key: "MEETINGS", label: "Meetings" },
  { key: "EXTERIOR", label: "Exterior" },
  { key: "COMMON", label: "Common Areas" },
  { key: "EXPERIENCES", label: "Experiences" },
];

export function GalleryPage({ content }: { content: PublicContent }) {
  usePageMeta(
    "Gallery",
    "Photo gallery of Hillstar Hotel — rooms, restaurant, meeting facilities and common areas in Dar es Salaam.",
    "/images/hero-lobby.jpg"
  );

  const [filter, setFilter] = useState("ALL");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const images = useMemo(
    () => content.gallery.filter((g) => filter === "ALL" || g.category === filter),
    [content.gallery, filter]
  );

  return (
    <div>
      <PageHero
        image="/images/hero-lobby.jpg"
        eyebrow="Gallery"
        title="A look inside Hillstar"
        intro="Rooms, dining, meetings and the small details that make a stay with us feel like home."
      />

      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {FILTERS.filter((f) => f.key === "ALL" || content.gallery.some((g) => g.category === f.key)).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  filter === f.key
                    ? "bg-navy-900 text-ivory"
                    : "border border-border bg-card text-muted-foreground hover:text-navy-900"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="mt-8 columns-2 gap-3 md:columns-3 md:gap-4 [&>*]:mb-3 md:[&>*]:mb-4">
            {images.map((g, i) => (
              <button
                key={g.id}
                onClick={() => setLightbox(i)}
                className="group relative block w-full overflow-hidden bg-sand break-inside-avoid"
                aria-label={`Open image: ${g.caption || "gallery"}`}
              >
                { }
                <img
                  src={g.url}
                  alt={g.caption || "Hillstar Hotel"}
                  loading="lazy"
                  className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <span className="absolute inset-0 flex items-end bg-gradient-to-t from-navy-950/70 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {g.caption && <span className="text-sm text-ivory">{g.caption}</span>}
                </span>
              </button>
            ))}
          </div>

          {images.length === 0 && (
            <p className="mt-10 text-center text-sm text-muted-foreground">
              No photos in this category yet — please check back soon.
            </p>
          )}
        </div>
      </section>

      {lightbox !== null && (
        <Lightbox
          images={images.map((g) => ({ url: g.url, caption: g.caption }))}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNavigate={setLightbox}
        />
      )}
    </div>
  );
}
