"use client";

import { RoomCategoryPublic } from "@/lib/site-hooks";
import { formatTZS } from "@/lib/format";
import { navigate, buildHash } from "@/lib/site-hooks";
import { BedDouble, UserRound, Users, Maximize, ArrowRight } from "lucide-react";

export function RoomCard({
  category,
  searchParams,
}: {
  category: RoomCategoryPublic;
  searchParams?: { checkIn?: string; checkOut?: string; adults?: number; children?: number };
}) {
  return (
    <article className="group flex flex-col bg-card border border-border/70 overflow-hidden transition-all duration-300 hover:shadow-[0_18px_50px_rgba(11,29,51,0.12)] hover:-translate-y-0.5">
      <button
        onClick={() => navigate(`/rooms/${category.slug}`)}
        className="relative aspect-[4/3] overflow-hidden block"
        aria-label={`View ${category.name}`}
      >
        {category.coverImage ? (
           
          <img
            src={category.coverImage}
            alt={category.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="h-full w-full bg-sand" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/55 via-transparent to-transparent opacity-80" />
        <span className="absolute bottom-3 left-4 bg-navy-950/85 backdrop-blur px-3 py-1.5 text-sm font-semibold text-gold-400">
          {formatTZS(category.pricePerNight)}
          <span className="text-ivory/70 font-normal"> / night</span>
        </span>
      </button>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl text-navy-900 leading-snug">{category.name}</h3>
          {category.featured && (
            <span className="shrink-0 border border-gold-500/50 bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-700">
              Guest Favourite
            </span>
          )}
        </div>
        {category.tagline && (
          <p className="mt-1 text-xs uppercase tracking-wide text-gold-700">{category.tagline}</p>
        )}
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-2">
          {category.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {category.bedConfiguration && (
            <span className="inline-flex items-center gap-1.5">
              <BedDouble className="h-3.5 w-3.5 text-gold-600" />
              {category.bedConfiguration}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-gold-600" />
            Up to {category.maxTotalGuests} guests
          </span>
          {category.sizeSqm ? (
            <span className="inline-flex items-center gap-1.5">
              <Maximize className="h-3.5 w-3.5 text-gold-600" />
              {category.sizeSqm} m²
            </span>
          ) : null}
        </div>

        {category.amenities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {category.amenities.slice(0, 4).map((a) => (
              <span key={a} className="bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                {a}
              </span>
            ))}
            {category.amenities.length > 4 && (
              <span className="px-2 py-1 text-[11px] text-muted-foreground">
                +{category.amenities.length - 4} more
              </span>
            )}
          </div>
        )}

        <div className="mt-5 flex items-center gap-2.5 pt-1">
          <button
            onClick={() =>
              navigate(buildHash("/booking", { categoryId: category.id, ...searchParams }))
            }
            className="flex-1 bg-navy-900 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory hover:bg-navy-800 transition-colors inline-flex items-center justify-center gap-1.5"
          >
            Check Availability
          </button>
          <button
            onClick={() => navigate(`/rooms/${category.slug}`)}
            className="inline-flex items-center gap-1.5 border border-navy-900/25 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-navy-900 hover:bg-navy-900 hover:text-ivory transition-colors"
          >
            Details
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
