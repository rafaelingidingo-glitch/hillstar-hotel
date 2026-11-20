"use client";

import { useMemo, useState } from "react";
import { type RoomCategoryPublic, type PublicContent, usePageMeta, navigate, buildHash } from "@/lib/site-hooks";
import { BookingSearchBar } from "../booking-search-bar";
import { AmenityIcon } from "../amenity-icon";
import { Lightbox } from "../lightbox";
import { formatTZS, todayStr, addDaysStr } from "@/lib/format";
import {
  BedDouble,
  UserRound,
  Users,
  Maximize,
  ChevronLeft,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export function RoomDetailPage({ content, slug }: { content: PublicContent; slug: string }) {
  const category = useMemo(
    () => content.roomCategories.find((c) => c.slug === decodeURIComponent(slug)),
    [content.roomCategories, slug]
  );

  usePageMeta(
    category ? category.name : "Room",
    category ? `${category.name} at Hillstar Hotel, Dar es Salaam — ${category.description.slice(0, 130)}` : undefined,
    category?.coverImage || undefined
  );

  const [lightbox, setLightbox] = useState<number | null>(null);
  const [bookingInitial, setBookingInitial] = useState<{
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
  }>({ checkIn: todayStr(), checkOut: addDaysStr(todayStr(), 2), adults: 2, children: 0 });

  if (!category) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-3xl text-navy-900">Room not found</p>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          This room type may no longer be offered. Browse our current selection instead.
        </p>
        <button
          onClick={() => navigate("/rooms")}
          className="mt-8 inline-flex items-center gap-2 bg-navy-900 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-ivory hover:bg-navy-800 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          All Rooms & Suites
        </button>
      </div>
    );
  }

  const images = category.images.length > 0 ? category.images : [category.coverImage];
  const others = content.roomCategories.filter((c) => c.id !== category.id).slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[52vh] min-h-[420px] max-h-[620px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center kenburns"
          style={{ backgroundImage: `url(${images[0]})` }}
          role="img"
          aria-label={category.name}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/70 via-navy-950/35 to-navy-950/85" />
        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-10 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate("/rooms")}
            className="mb-6 inline-flex w-fit items-center gap-2 text-xs uppercase tracking-wider text-ivory/80 hover:text-gold-300 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Rooms & Suites
          </button>
          <p className="text-[11px] font-semibold uppercase tracking-brand text-gold-400">{category.tagline}</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-display text-4xl md:text-5xl text-ivory text-shadow-hero">{category.name}</h1>
            <div className="text-right">
              <p className="font-display text-3xl text-gold-400">{formatTZS(category.pricePerNight)}</p>
              <p className="text-xs uppercase tracking-wider text-ivory/70">per night</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key facts bar */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border sm:grid-cols-4">
          {[
            { icon: <BedDouble className="h-4 w-4" />, label: "Bed", value: category.bedConfiguration || "—" },
            { icon: <Users className="h-4 w-4" />, label: "Max guests", value: `${category.maxTotalGuests}` },
            {
              icon: <UserRound className="h-4 w-4" />,
              label: "Adults / Children",
              value: `${category.maxAdults} / ${category.maxChildren}`,
            },
            { icon: <Maximize className="h-4 w-4" />, label: "Size", value: category.sizeSqm ? `${category.sizeSqm} m²` : "—" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-3 px-4 py-4">
              <span className="text-gold-600">{f.icon}</span>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.label}</p>
                <p className="text-sm font-medium text-navy-900">{f.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Main column */}
            <div className="lg:col-span-2">
              <h2 className="font-display text-2xl text-navy-900 gold-underline">About this room</h2>
              <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">{category.description}</p>

              <h3 className="mt-10 text-xs font-semibold uppercase tracking-brand text-gold-700">Room amenities</h3>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {category.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-3 border border-border/70 bg-card px-4 py-3">
                    <AmenityIcon name={a} className="h-4 w-4 shrink-0 text-gold-600" />
                    <span className="text-sm text-foreground">{a}</span>
                  </div>
                ))}
              </div>

              {/* Photo strip */}
              <h3 className="mt-12 text-xs font-semibold uppercase tracking-brand text-gold-700">Photos</h3>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((img, i) => (
                  <button
                    key={img + i}
                    onClick={() => setLightbox(i)}
                    className="group aspect-[4/3] overflow-hidden bg-sand"
                    aria-label={`Open photo ${i + 1}`}
                  >
                    { }
                    <img
                      src={img}
                      alt={`${category.name} photo ${i + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Booking panel */}
            <aside>
              <div className="sticky top-24 border border-border bg-card p-6 shadow-[0_10px_40px_rgba(11,29,51,0.08)]">
                <p className="text-xs uppercase tracking-brand text-gold-700">Book this room</p>
                <p className="mt-2 font-display text-3xl text-navy-900">{formatTZS(category.pricePerNight)}</p>
                <p className="text-xs text-muted-foreground">per night, taxes may apply</p>

                <div className="mt-6">
                  <BookingSearchBar
                    content={content}
                    compact
                    initial={{ ...bookingInitial, categoryId: category.id }}
                  />
                </div>

                <div className="mt-6 space-y-2.5 text-xs text-muted-foreground">
                  <p className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-600" />
                    No prepayment — request now, confirm with our team via WhatsApp.
                  </p>
                  <p className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-600" />
                    Check-in from {content.settings.booking.checkInTime} · Check-out by {content.settings.booking.checkOutTime}
                  </p>
                  <p className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-600" />
                    Free parking for guests, subject to availability.
                  </p>
                </div>
              </div>
            </aside>
          </div>

          {/* Other rooms */}
          {others.length > 0 && (
            <div className="mt-16 border-t border-border pt-12">
              <h3 className="font-display text-2xl text-navy-900">You may also like</h3>
              <div className="mt-6 grid gap-5 sm:grid-cols-3">
                {others.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => navigate(`/rooms/${o.slug}`)}
                    className="group text-left border border-border/70 bg-card overflow-hidden transition-shadow hover:shadow-md"
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-sand">
                      { }
                      <img
                        src={o.coverImage}
                        alt={o.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-display text-lg text-navy-900">{o.name}</p>
                        <span className="text-sm font-semibold text-gold-700">{formatTZS(o.pricePerNight)}</span>
                      </div>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        Explore <ArrowRight className="h-3 w-3" />
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {lightbox !== null && (
        <Lightbox
          images={images.map((u) => ({ url: u, caption: category.name }))}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNavigate={setLightbox}
        />
      )}
    </div>
  );
}
