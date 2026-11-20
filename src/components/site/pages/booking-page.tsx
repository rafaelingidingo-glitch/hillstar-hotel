"use client";

import { useMemo } from "react";
import { type PublicContent, usePageMeta, navigate, buildHash } from "@/lib/site-hooks";
import { apiSend } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { BookingSearchBar } from "../booking-search-bar";
import { formatTZS, formatDateMedium, nightsBetweenStrs, todayStr, addDaysStr } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Search,
  BedDouble,
  Users,
  UserRound,
  Baby,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Maximize,
  CircleAlert,
} from "lucide-react";

interface AvailabilityResult {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  nights: number;
  categories: {
    categoryId: string;
    slug: string;
    name: string;
    tagline: string;
    description: string;
    coverImage: string;
    images: string[];
    amenities: string[];
    bedConfiguration: string;
    sizeSqm: number | null;
    maxAdults: number;
    maxChildren: number;
    maxTotalGuests: number;
    pricePerNight: number;
    available: number;
    totalSellable: number;
    capacityMessage: string | null;
    nights: number;
    totalForStay: number;
  }[];
}

interface FreeRoomsResponse {
  rooms: { roomId: string; number: string; floor: string; free: boolean }[];
}

export function BookingPage({
  content,
  params,
}: {
  content: PublicContent;
  params: Record<string, string>;
}) {
  usePageMeta(
    "Book Your Stay",
    "Check availability and request your room at Hillstar Hotel, Dar es Salaam.",
    "/images/room-executive.jpg"
  );

  const today = todayStr();
  const checkIn = params.checkIn && /^\d{4}-\d{2}-\d{2}$/.test(params.checkIn) ? params.checkIn : today;
  const checkOut = params.checkOut && /^\d{4}-\d{2}-\d{2}$/.test(params.checkOut) ? params.checkOut : addDaysStr(today, 2);
  const adults = Math.max(1, Number(params.adults) || 2);
  const children = Math.max(0, Number(params.children) || 0);

  const nights = useMemo(() => {
    try {
      const n = nightsBetweenStrs(checkIn, checkOut);
      return n > 0 ? n : 0;
    } catch {
      return 0;
    }
  }, [checkIn, checkOut]);

  // Availability lives in React Query keyed by the search — no manual effects needed.
  const availabilityQuery = useQuery({
    queryKey: ["availability", checkIn, checkOut, adults, children],
    queryFn: () =>
      apiSend<AvailabilityResult>("/api/public/availability", "POST", {
        checkIn,
        checkOut,
        adults,
        children,
        rooms: 1,
      }),
    retry: 1,
  });

  const categories = availabilityQuery.data?.categories ?? [];
  const availableIds = categories
    .filter((c) => c.available > 0)
    .map((c) => c.categoryId)
    .join(",");

  const freeRoomsQuery = useQuery({
    queryKey: ["free-rooms", checkIn, checkOut, availableIds],
    queryFn: async () => {
      const cats = availabilityQuery.data!.categories.filter((c) => c.available > 0);
      const lists = await Promise.all(
        cats.map((c) =>
          apiSend<FreeRoomsResponse>("/api/public/availability/rooms", "POST", {
            categoryId: c.categoryId,
            checkIn,
            checkOut,
          }).catch(() => null)
        )
      );
      const map: Record<string, string[]> = {};
      cats.forEach((c, i) => {
        const list = lists[i];
        if (list) map[c.categoryId] = list.rooms.filter((r) => r.free).map((r) => r.number);
      });
      return map;
    },
    enabled: availableIds.length > 0,
  });

  const results = availabilityQuery.data ?? null;
  const loading = availabilityQuery.isPending;
  const error = availabilityQuery.isError
    ? availabilityQuery.error instanceof Error
      ? availabilityQuery.error.message
      : "Search failed. Please try again."
    : null;
  const freeRooms = freeRoomsQuery.data ?? {};

  // The search inputs currently shown in the bar
  const currentSearch = { checkIn, checkOut, adults, children };


  return (
    <div className="bg-ivory">
      {/* Header + compact search */}
      <section className="bg-navy-950 pt-28 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-brand text-gold-400">Booking</p>
          <h1 className="mt-3 font-display text-3xl md:text-4xl text-ivory">Check availability</h1>
          <p className="mt-2 max-w-2xl text-sm text-ivory/70">
            Request-to-book — choose your dates, room type and preferred room. Our team confirms on WhatsApp.
          </p>
          <div className="mt-8">
            <BookingSearchBar
              content={content}
              compact
              initial={{ checkIn, checkOut, adults, children }}
            />
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">
            {formatDateMedium(currentSearch.checkIn)} → {formatDateMedium(currentSearch.checkOut)} ·{" "}
            {nights > 0 ? `${nights} night${nights > 1 ? "s" : ""}` : "invalid dates"} · {adults} adult
            {adults > 1 ? "s" : ""}
            {children > 0 ? `, ${children} child${children > 1 ? "ren" : ""}` : ""}
          </p>

          {loading && (
            <div className="mt-16 flex flex-col items-center gap-4 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
              <p className="text-sm uppercase tracking-wider">Checking live availability…</p>
            </div>
          )}

          {error && (
            <div className="mt-10 border border-destructive/40 bg-destructive/5 p-5 text-sm text-destructive">
              {error}
            </div>
          )}

          {results && !loading && (
            <div className="mt-8 space-y-6">
              {results.categories.map((c) => {
                const roomNumbers = freeRooms[c.categoryId] ?? [];
                const capacityBlocked = !!c.capacityMessage;
                return (
                  <article
                    key={c.categoryId}
                    className={`grid gap-0 border bg-card overflow-hidden md:grid-cols-[300px_1fr] ${
                      capacityBlocked || c.available === 0 ? "opacity-90" : ""
                    }`}
                  >
                    <div className="relative min-h-[220px] md:min-h-full">
                      {c.coverImage ? (
                         
                        <img
                          src={c.coverImage}
                          alt={c.name}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-sand" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-navy-950/50 to-transparent md:bg-gradient-to-r" />
                      <span className="absolute top-3 left-3 bg-navy-950/85 px-3 py-1 text-xs font-semibold text-gold-400 backdrop-blur">
                        {c.available > 0
                          ? `${c.available} room${c.available > 1 ? "s" : ""} available`
                          : "Fully booked for these dates"}
                      </span>
                    </div>

                    <div className="flex flex-col p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="font-display text-2xl text-navy-900">{c.name}</h2>
                          {c.tagline && <p className="mt-1 text-xs uppercase tracking-wide text-gold-700">{c.tagline}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-display text-2xl text-navy-900">{formatTZS(c.pricePerNight)}</p>
                          <p className="text-xs text-muted-foreground">per night</p>
                        </div>
                      </div>

                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-2">{c.description}</p>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                        {c.bedConfiguration && (
                          <span className="inline-flex items-center gap-1.5">
                            <BedDouble className="h-3.5 w-3.5 text-gold-600" />
                            {c.bedConfiguration}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                          <UserRound className="h-3.5 w-3.5 text-gold-600" /> {c.maxAdults} adults
                        </span>
                        {c.maxChildren > 0 && (
                          <span className="inline-flex items-center gap-1.5">
                            <Baby className="h-3.5 w-3.5 text-gold-600" /> {c.maxChildren} children
                          </span>
                        )}
                        {c.sizeSqm ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Maximize className="h-3.5 w-3.5 text-gold-600" /> {c.sizeSqm} m²
                          </span>
                        ) : null}
                      </div>

                      {nights > 0 && (
                        <p className="mt-3 text-sm">
                          <span className="text-muted-foreground">Total for {nights} night{nights > 1 ? "s" : ""}: </span>
                          <span className="font-semibold text-navy-900">{formatTZS(c.pricePerNight * nights)}</span>
                        </p>
                      )}

                      {c.capacityMessage ? (
                        <div className="mt-4 flex items-center gap-2 border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-xs text-destructive">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          {c.capacityMessage} Adjust your guest count or choose a larger room type.
                        </div>
                      ) : c.available === 0 ? (
                        <div className="mt-4 flex items-center gap-2 border border-border bg-muted px-4 py-2.5 text-xs text-muted-foreground">
                          <XCircle className="h-4 w-4 shrink-0" />
                          No rooms of this type are free for the selected dates — try different dates or another room type.
                        </div>
                      ) : (
                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-gold-600" />
                            {roomNumbers.length > 0
                              ? `Open rooms: ${roomNumbers.slice(0, 6).join(", ")}${roomNumbers.length > 6 ? "…" : ""}`
                              : "A room will be assigned from this category"}
                          </div>
                          <button
                            onClick={() =>
                              navigate(
                                buildHash("/booking/request", {
                                  categoryId: c.categoryId,
                                  checkIn: currentSearch.checkIn,
                                  checkOut: currentSearch.checkOut,
                                  adults,
                                  children,
                                })
                              )
                            }
                            className="inline-flex items-center justify-center gap-2 bg-gold-500 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-navy-950 hover:bg-gold-400 transition-colors"
                          >
                            Select & Continue
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}

              {results.categories.length === 0 && (
                <div className="border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                  <CircleAlert className="mx-auto h-8 w-8 text-gold-600" />
                  <p className="mt-3">No room categories are currently published. Please contact the hotel directly.</p>
                  <button
                    onClick={() => navigate("/contact")}
                    className="mt-4 inline-flex items-center gap-2 bg-navy-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory"
                  >
                    Contact Us <Search className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
