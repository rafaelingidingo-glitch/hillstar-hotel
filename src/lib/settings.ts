import { db } from "@/lib/db";

export interface HotelSettings {
  hotel: {
    name: string;
    tagline: string;
    phone: string;
    whatsapp: string; // international format without +
    whatsappDisplay: string;
    email: string;
    address: string;
    mapUrl: string;
  };
  hero: {
    headline: string;
    subheadline: string;
    images: string[];
    primaryCta: string;
    secondaryCta: string;
  };
  welcome: {
    title: string;
    paragraphs: string[];
    images: string[];
  };
  restaurant: {
    title: string;
    intro: string;
    hours: { label: string; time: string }[];
    reservationNote: string;
  };
  meetings: {
    title: string;
    intro: string;
    note: string;
  };
  about: {
    title: string;
    story: string[];
    mission: string;
    vision: string;
    values: { title: string; text: string }[];
  };
  booking: {
    pendingExpirationMinutes: number;
    checkInTime: string;
    checkOutTime: string;
    childrenPolicy: string;
    cancellationNote: string;
    requestNote: string;
  };
  footer: {
    note: string;
  };
}

export const DEFAULT_SETTINGS: HotelSettings = {
  hotel: {
    name: "Hillstar Hotel",
    tagline: "Comfort & Hospitality in Dar es Salaam",
    phone: "+255725221069",
    whatsapp: "255725221069",
    whatsappDisplay: "+255 725 221 069",
    email: "reservations@hillstarhotel.co.tz",
    address: "Togo Street, Dar es Salaam, Tanzania",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Togo+Street+Dar+es+Salaam+Tanzania",
  },
  hero: {
    headline: "Experience Comfort. Discover Hillstar.",
    subheadline:
      "Experience welcoming hospitality, comfortable accommodation, and convenient services in the heart of Dar es Salaam.",
    images: ["/images/hero-exterior.jpg", "/images/hero-lobby.jpg", "/images/hero-dining.jpg"],
    primaryCta: "Book Your Stay",
    secondaryCta: "Explore Hillstar",
  },
  welcome: {
    title: "Welcome to Hillstar Hotel",
    paragraphs: [
      "Set on Togo Street in Dar es Salaam, Hillstar Hotel brings together comfortable accommodation, a welcoming restaurant, and well-equipped meeting facilities — everything you need for a restful stay or a productive business visit.",
      "Our team is dedicated to genuine, attentive hospitality. Whether you are visiting Dar es Salaam for business or leisure, we look forward to welcoming you.",
    ],
    images: ["/images/hero-lobby.jpg", "/images/common-terrace.jpg", "/images/about-reception.jpg"],
  },
  restaurant: {
    title: "Dining at Hillstar",
    intro:
      "From hearty breakfasts to flavourful East African favourites, our restaurant serves freshly prepared dishes throughout the day in a warm, relaxed setting.",
    hours: [
      { label: "Breakfast", time: "06:30 – 10:00" },
      { label: "Lunch", time: "12:00 – 15:00" },
      { label: "Dinner", time: "18:00 – 22:30" },
    ],
    reservationNote: "Table reservations can be arranged by phone or WhatsApp.",
  },
  meetings: {
    title: "Meetings & Events",
    intro:
      "Host productive gatherings in our flexible meeting spaces, supported by modern equipment and attentive service.",
    note: "Every event is different — tell us about yours and our team will prepare a tailored quotation.",
  },
  about: {
    title: "About Hillstar Hotel",
    story: [
      "Hillstar Hotel is an independent hospitality destination in Dar es Salaam offering accommodation, dining, and meeting facilities under one roof.",
      "We believe great hospitality is built on consistency: clean, comfortable rooms; honest, freshly prepared food; and a team that treats every guest like a welcome friend.",
    ],
    mission:
      "To provide every guest with a comfortable, secure, and welcoming experience — delivered with warmth and professionalism.",
    vision:
      "To be Dar es Salaam's most trusted address for comfortable stays and professional gatherings.",
    values: [
      { title: "Genuine Warmth", text: "Hospitality that feels personal, never scripted." },
      { title: "Comfort First", text: "Clean, quiet, well-kept rooms and thoughtful amenities." },
      { title: "Reliability", text: "Dependable service for business travellers and event hosts." },
      { title: "Community", text: "Proudly serving guests and partners across Dar es Salaam." },
    ],
  },
  booking: {
    pendingExpirationMinutes: 15,
    checkInTime: "14:00",
    checkOutTime: "10:00",
    childrenPolicy: "Children are welcome. When booking, please include the number of children in your party.",
    cancellationNote:
      "Booking requests are confirmed by our reservations team. To cancel or modify a confirmed reservation, please contact us as early as possible.",
    requestNote:
      "This is a request-to-book reservation. Our team confirms availability after receiving your request — no payment is required at this step.",
  },
  footer: {
    note: "Hillstar Hotel — Togo Street, Dar es Salaam, Tanzania.",
  },
};

function deepMerge<T>(base: T, patch: unknown): T {
  if (patch === null || patch === undefined) return base;
  if (Array.isArray(base) || typeof base !== "object") return patch as T;
  if (typeof patch !== "object" || Array.isArray(patch)) return patch as T;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    out[k] = k in out ? deepMerge((base as Record<string, unknown>)[k], v) : v;
  }
  return out as T;
}

export async function getSettings(): Promise<HotelSettings> {
  const rows = await db.setting.findMany({ where: { key: "site" } });
  const stored = rows.length > 0 ? JSON.parse(rows[0].value) : {};
  return deepMerge(DEFAULT_SETTINGS, stored);
}

export async function updateSettings(patch: unknown): Promise<HotelSettings> {
  const current = await getSettings();
  const merged = deepMerge(current, patch);
  await db.setting.upsert({
    where: { key: "site" },
    update: { value: JSON.stringify(merged) },
    create: { key: "site", value: JSON.stringify(merged) },
  });
  return merged;
}

export async function getPendingExpirationMinutes(): Promise<number> {
  const s = await getSettings();
  const m = Number(s.booking.pendingExpirationMinutes);
  return Number.isFinite(m) && m > 0 ? Math.min(m, 2880) : 15;
}
