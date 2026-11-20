"use client";

import { useMemo, useState } from "react";
import { buildHash, navigate } from "@/lib/site-hooks";
import { formatTZS, todayStr, addDaysStr, nightsBetweenStrs } from "@/lib/format";
import type { PublicContent } from "@/lib/site-hooks";
import { CalendarDays, Users, Search, Loader2, UserRound, Baby } from "lucide-react";

function DateField({
  label,
  value,
  onChange,
  min,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: string;
  id: string;
}) {
  return (
    <div className="flex-1 min-w-[140px]">
      <label htmlFor={id} className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-ivory/60">
        <CalendarDays className="h-3 w-3" />
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full bg-transparent border-b border-ivory/25 pb-1.5 text-sm text-ivory [color-scheme:dark] focus:outline-none focus:border-gold-500 transition-colors"
      />
    </div>
  );
}

function CountField({
  label,
  value,
  onChange,
  min,
  max,
  icon,
  id,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  icon: React.ReactNode;
  id: string;
}) {
  return (
    <div className="min-w-[90px]">
      <label htmlFor={id} className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-ivory/60">
        {icon}
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full bg-transparent border-b border-ivory/25 pb-1.5 text-sm text-ivory focus:outline-none focus:border-gold-500 transition-colors cursor-pointer [&>option]:text-navy-900 [&>option]:bg-white"
      >
        {Array.from({ length: max - min + 1 }, (_, i) => (
          <option key={i} value={min + i}>
            {min + i}
          </option>
        ))}
      </select>
    </div>
  );
}

export function BookingSearchBar({
  content,
  compact = false,
  initial,
}: {
  content: PublicContent;
  compact?: boolean;
  initial?: { checkIn?: string; checkOut?: string; adults?: number; children?: number; categoryId?: string };
}) {
  const today = todayStr();
  const [checkIn, setCheckIn] = useState(initial?.checkIn || today);
  const [checkOut, setCheckOut] = useState(initial?.checkOut || addDaysStr(today, 2));
  const [adults, setAdults] = useState(initial?.adults || 2);
  const [children, setChildren] = useState(initial?.children || 0);
  const [categoryId, setCategoryId] = useState(initial?.categoryId || "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nights = useMemo(() => {
    try {
      const n = nightsBetweenStrs(checkIn, checkOut);
      return n > 0 ? n : 0;
    } catch {
      return 0;
    }
  }, [checkIn, checkOut]);

  const minCheckOut = useMemo(() => addDaysStr(checkIn || today, 1), [checkIn, today]);

  const submit = () => {
    setError(null);
    if (!checkIn || !checkOut) {
      setError("Please select both check-in and check-out dates.");
      return;
    }
    if (checkIn < today) {
      setError("Check-in date cannot be in the past.");
      return;
    }
    if (nights <= 0) {
      setError("Check-out must be after check-in.");
      return;
    }
    const cat = categoryId ? content.roomCategories.find((c) => c.id === categoryId) : undefined;
    if (cat) {
      if (adults > cat.maxAdults) {
        setError(`${cat.name} accommodates up to ${cat.maxAdults} adults. Please adjust your search.`);
        return;
      }
      if (children > cat.maxChildren) {
        setError(`${cat.name} accommodates up to ${cat.maxChildren} children.`);
        return;
      }
      if (adults + children > cat.maxTotalGuests) {
        setError(`${cat.name} accommodates up to ${cat.maxTotalGuests} guests in total.`);
        return;
      }
    }
    setSubmitting(true);
    navigate(
      buildHash("/booking", {
        checkIn,
        checkOut,
        adults,
        children,
        ...(categoryId ? { categoryId } : {}),
      })
    );
  };

  return (
    <div
      className={`w-full bg-navy-950/92 backdrop-blur-md border border-gold-500/30 shadow-[0_20px_60px_rgba(7,20,38,0.4)] ${
        compact ? "p-4" : "p-5 md:p-6"
      }`}
      role="search"
      aria-label="Check availability"
    >
      <div className="flex flex-wrap gap-x-6 gap-y-4">
        <DateField id="bs-checkin" label="Check-in" value={checkIn} onChange={setCheckIn} min={today} />
        <DateField id="bs-checkout" label="Check-out" value={checkOut} onChange={setCheckOut} min={minCheckOut} />
        <CountField id="bs-adults" label="Adults" value={adults} onChange={setAdults} min={1} max={8} icon={<UserRound className="h-3 w-3" />} />
        <CountField id="bs-children" label="Children" value={children} onChange={setChildren} min={0} max={6} icon={<Baby className="h-3 w-3" />} />
        {!compact && (
          <div className="min-w-[150px]">
            <label htmlFor="bs-category" className="block text-[10px] font-semibold uppercase tracking-wider text-ivory/60">
              Room Type
            </label>
            <select
              id="bs-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1.5 w-full bg-transparent border-b border-ivory/25 pb-1.5 text-sm text-ivory focus:outline-none focus:border-gold-500 transition-colors cursor-pointer [&>option]:text-navy-900 [&>option]:bg-white"
            >
              <option value="">Any room type</option>
              {content.roomCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — from {formatTZS(c.pricePerNight)}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-end">
          <button
            onClick={submit}
            disabled={submitting}
            className="inline-flex h-[38px] items-center gap-2 bg-gold-500 px-6 text-sm font-semibold uppercase tracking-wider text-navy-950 hover:bg-gold-400 transition-colors disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search Availability
          </button>
        </div>
      </div>
      {nights > 0 && (
        <p className="mt-3 text-xs text-ivory/55">
          {nights} night{nights > 1 ? "s" : ""} · {adults} adult{adults > 1 ? "s" : ""}
          {children > 0 ? `, ${children} child${children > 1 ? "ren" : ""}` : ""}
        </p>
      )}
      {error && <p className="mt-3 text-xs text-red-300 font-medium">{error}</p>}
    </div>
  );
}
