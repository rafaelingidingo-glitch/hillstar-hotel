"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./api-client";
import type { HotelSettings } from "./settings";

// ---------------------------------------------------------------------------
// Public content types (mirror of /api/public/content payload)
// ---------------------------------------------------------------------------

export interface RoomCategoryPublic {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  pricePerNight: number;
  maxAdults: number;
  maxChildren: number;
  maxTotalGuests: number;
  bedConfiguration: string;
  sizeSqm: number | null;
  amenities: string[];
  coverImage: string;
  images: string[];
  featured: boolean;
  roomCount: number;
}

export interface AmenityPublic {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface GalleryImagePublic {
  id: string;
  url: string;
  caption: string;
  category: string;
}

export interface MenuItemPublic {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  featured: boolean;
}

export interface MenuCategoryPublic {
  id: string;
  name: string;
  description: string;
  items: MenuItemPublic[];
}

export interface MeetingRoomPublic {
  id: string;
  slug: string;
  name: string;
  description: string;
  capacity: number;
  seating: { name: string; capacity: number }[];
  equipment: string[];
  image: string;
  pricingNote: string;
  hourlyRate: number | null;
}

export interface PublicContent {
  settings: HotelSettings;
  roomCategories: RoomCategoryPublic[];
  amenities: AmenityPublic[];
  gallery: GalleryImagePublic[];
  menu: MenuCategoryPublic[];
  meetingRooms: MeetingRoomPublic[];
}

export function useContent() {
  return useQuery({
    queryKey: ["public-content"],
    queryFn: () => apiGet<PublicContent>("/api/public/content"),
    staleTime: 60_000,
    retry: 2,
  });
}

// ---------------------------------------------------------------------------
// Hash routing
// ---------------------------------------------------------------------------

export interface HashRoute {
  path: string;
  params: Record<string, string>;
  raw: string;
}

function parseHash(): HashRoute {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [path, query] = raw.split("?");
  const params: Record<string, string> = {};
  if (query) {
    for (const pair of query.split("&")) {
      const [k, v] = pair.split("=");
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
    }
  }
  return { path: path || "/", params, raw };
}

export function useHashRoute(): HashRoute {
  const [route, setRoute] = useState<HashRoute>(() =>
    typeof window === "undefined" ? { path: "/", params: {}, raw: "/" } : parseHash()
  );
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash());
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

export function navigate(to: string) {
  const target = to.startsWith("#") ? to : `#${to}`;
  if (window.location.hash === target) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = target;
  }
}

export function buildHash(path: string, params: Record<string, string | number | undefined> = {}): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return `#${path}${qs ? `?${qs}` : ""}`;
}

// ---------------------------------------------------------------------------
// Per-page document metadata (SPA)
// ---------------------------------------------------------------------------

export function usePageMeta(title: string, description?: string, imagePath?: string) {
  useEffect(() => {
    document.title = title
      ? `${title} | Hillstar Hotel`
      : "Hillstar Hotel — Comfort & Hospitality in Dar es Salaam";
    const setMeta = (selector: string, attr: string, value: string) => {
      const el = document.head.querySelector(selector);
      if (el) el.setAttribute(attr, value);
    };
    if (description) {
      setMeta('meta[name="description"]', "content", description);
      setMeta('meta[property="og:description"]', "content", description);
    }
    setMeta('meta[property="og:title"]', "content", title || "Hillstar Hotel");
    if (imagePath) {
      setMeta('meta[property="og:image"]', "content", imagePath);
    }
    setMeta('meta[property="og:url"]', "content", window.location.href);
  }, [title, description, imagePath]);
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

/**
 * Track whether the page is scrolled past a threshold (for the nav).
 * `initial` lets callers render a consistent first paint on server and client
 * (e.g. start "solid", correct after hydration) to avoid hydration mismatches.
 */
export function useScrolled(threshold = 40, initial = false): boolean {
  const [scrolled, setScrolled] = useState(initial);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

export function useWhatsAppNumber(settings: HotelSettings | undefined): string {
  return useMemo(() => settings?.hotel.whatsapp ?? "255725221069", [settings]);
}
