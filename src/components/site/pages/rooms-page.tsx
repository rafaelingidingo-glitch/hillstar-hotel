"use client";

import { useMemo, useState } from "react";
import { type PublicContent, usePageMeta } from "@/lib/site-hooks";
import { BookingSearchBar } from "../booking-search-bar";
import { RoomCard } from "../room-card";
import { PageHero } from "../ui-bits";
import { todayStr, addDaysStr } from "@/lib/format";

export function RoomsPage({
  content,
  params,
}: {
  content: PublicContent;
  params: Record<string, string>;
}) {
  usePageMeta(
    "Rooms & Suites",
    "Comfortable rooms and suites at Hillstar Hotel, Dar es Salaam — Standard, Deluxe, Executive and Twin rooms with modern amenities.",
    "/images/room-deluxe.jpg"
  );

  const [filters, setFilters] = useState({
    checkIn: params.checkIn || todayStr(),
    checkOut: params.checkOut || addDaysStr(todayStr(), 2),
    adults: Number(params.adults) || 2,
    children: Number(params.children) || 0,
    maxPrice: 0, // 0 = no filter
  });
  const [sort, setSort] = useState<"recommended" | "price_asc" | "price_desc">("recommended");
  // NOTE: when search params change, the parent remounts this page (key=route.raw),
  // so params are always reflected in the initial filter state.

  const maxPriceAvailable = useMemo(
    () => Math.max(...content.roomCategories.map((c) => c.pricePerNight), 0),
    [content.roomCategories]
  );

  const shown = useMemo(() => {
    let list = [...content.roomCategories];
    if (filters.maxPrice > 0) list = list.filter((c) => c.pricePerNight <= filters.maxPrice);
    if (sort === "price_asc") list.sort((a, b) => a.pricePerNight - b.pricePerNight);
    else if (sort === "price_desc") list.sort((a, b) => b.pricePerNight - a.pricePerNight);
    else list.sort((a, b) => Number(b.featured) - Number(a.featured));
    return list;
  }, [content.roomCategories, filters.maxPrice, sort]);

  return (
    <div>
      <PageHero
        image="/images/room-deluxe.jpg"
        eyebrow="Rooms & Suites"
        title="Rest well, every night"
        intro="Clean, comfortable and thoughtfully equipped rooms — from practical Standard rooms to our Executive Suite."
      />

      {/* Search strip */}
      <div className="relative z-10 mx-auto -mt-0 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-14 md:-mt-16">
          <BookingSearchBar
            content={content}
            compact
            initial={{
              checkIn: filters.checkIn,
              checkOut: filters.checkOut,
              adults: filters.adults,
              children: filters.children,
            }}
          />
        </div>
      </div>

      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {shown.length} room type{shown.length !== 1 ? "s" : ""} · showing nightly rates in Tanzanian Shillings
            </p>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Price up to
                <select
                  value={filters.maxPrice}
                  onChange={(e) => setFilters((f) => ({ ...f, maxPrice: Number(e.target.value) }))}
                  className="border border-border bg-card px-2 py-1.5 text-xs text-foreground cursor-pointer"
                >
                  <option value={0}>Any price</option>
                  <option value={100000}>100,000 TZS</option>
                  <option value={150000}>150,000 TZS</option>
                  <option value={200000}>200,000 TZS</option>
                  {maxPriceAvailable > 200000 && <option value={maxPriceAvailable}>Any price (max)</option>}
                </select>
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Sort
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  className="border border-border bg-card px-2 py-1.5 text-xs text-foreground cursor-pointer"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price_asc">Price: low to high</option>
                  <option value="price_desc">Price: high to low</option>
                </select>
              </label>
            </div>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((c) => (
              <RoomCard
                key={c.id}
                category={c}
                searchParams={{
                  checkIn: filters.checkIn,
                  checkOut: filters.checkOut,
                  adults: filters.adults,
                  children: filters.children,
                }}
              />
            ))}
          </div>

          {content.roomCategories.length === 0 && (
            <p className="mt-8 text-sm text-muted-foreground">
              Room categories will appear here once configured in the admin dashboard.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
