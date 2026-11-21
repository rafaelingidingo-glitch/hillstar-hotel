import { db } from "@/lib/db";
import { expireStalePendingBookings } from "./availability";
import { formatShortDate } from "./tz";

// ---------------------------------------------------------------------------
// Background expiry sweeper — reliable server-side processing.
// Runs on an interval inside the Node process, independent of any frontend timer.
// ---------------------------------------------------------------------------

const globalForSweeper = globalThis as unknown as { hillstarSweeper?: boolean };

export function ensureExpirySweeper() {
  if (globalForSweeper.hillstarSweeper) return;
  globalForSweeper.hillstarSweeper = true;
  const run = async () => {
    try {
      const count = await expireStalePendingBookings();
      if (count > 0) {
        await db.notification.create({
          data: {
            type: "BOOKING_EXPIRED",
            title: `${count} booking request${count > 1 ? "s" : ""} expired`,
            message: `${count} pending request${count > 1 ? "s" : ""} passed the confirmation window and expired. Inventory holds were released.`,
            link: "#/admin/reservations?status=EXPIRED",
          },
        });
      }
    } catch (e) {
      console.error("[expiry-sweeper]", e);
    }
  };
  // Initial run shortly after boot. On serverless platforms (e.g. Vercel) the
  // interval cannot outlive the request, so it is skipped there — expiry is
  // additionally enforced inline before availability checks and admin views,
  // and by the Vercel Cron hitting /api/admin/maintenance/expire.
  setTimeout(run, 3000);
  if (!process.env.VERCEL) {
    setInterval(run, 30000);
  }
}

// ---------------------------------------------------------------------------
// Booking references: HST-2026-0001
// ---------------------------------------------------------------------------

export async function generateBookingReference(tx?: {
  booking: {
    count: (args: { where: { reference: { startsWith: string } } }) => Promise<number>;
    findUnique: (args: { where: { reference: string } }) => Promise<{ id: string } | null>;
  };
}): Promise<string> {
  const client = tx ?? db;
  const year = new Date().getFullYear();
  const prefix = `HST-${year}-`;
  const count = await client.booking.count({
    where: { reference: { startsWith: prefix } },
  });
  let seq = count + 1;
  // Retry in case of gaps/collisions
  for (let attempt = 0; attempt < 20; attempt++) {
    const ref = `${prefix}${String(seq).padStart(4, "0")}`;
    const exists = await client.booking.findUnique({ where: { reference: ref } });
    if (!exists) return ref;
    seq++;
  }
  // Fallback with timestamp
  return `${prefix}${Date.now().toString().slice(-6)}`;
}

export async function generateInquiryReference(prefix: string): Promise<string> {
  const year = new Date().getFullYear();
  const p = `${prefix}-${year}-`;
  const count = await db.meetingInquiry.count({ where: { reference: { startsWith: p } } });
  let seq = count + 1;
  for (let attempt = 0; attempt < 20; attempt++) {
    const ref = `${p}${String(seq).padStart(4, "0")}`;
    const exists = await db.meetingInquiry.findUnique({ where: { reference: ref } });
    if (!exists) return ref;
    seq++;
  }
  return `${p}${Date.now().toString().slice(-6)}`;
}

// ---------------------------------------------------------------------------
// WhatsApp message builders
// ---------------------------------------------------------------------------

export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export interface BookingMessageData {
  reference: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  categoryName: string;
  roomNumber?: string | null;
  checkIn: Date | string;
  checkOut: Date | string;
  nights: number;
  adults: number;
  children: number;
  estimatedTotal: number;
  specialRequests?: string;
}

export function buildBookingWhatsAppMessage(b: BookingMessageData): string {
  const lines = [
    "Hello Hillstar Hotel, I would like to request a booking.",
    "",
    `Booking Reference: ${b.reference}`,
    `Guest Name: ${b.guestName}`,
    `Phone: ${b.guestPhone}`,
    b.guestEmail ? `Email: ${b.guestEmail}` : null,
    `Room Category: ${b.categoryName}`,
    b.roomNumber ? `Room Number: ${b.roomNumber}` : null,
    `Check-in: ${formatShortDate(b.checkIn)}`,
    `Check-out: ${formatShortDate(b.checkOut)} (${b.nights} night${b.nights > 1 ? "s" : ""})`,
    `Guests: ${b.adults} adult${b.adults > 1 ? "s" : ""}${b.children > 0 ? `, ${b.children} child${b.children > 1 ? "ren" : ""}` : ""}`,
    `Estimated Total: TZS ${b.estimatedTotal.toLocaleString("en-TZ")}`,
    b.specialRequests ? `Special Requests: ${b.specialRequests}` : null,
    "",
    "Please confirm availability. Thank you!",
  ].filter(Boolean);
  return lines.join("\n") as string;
}

export function buildTableReservationWhatsAppMessage(d: {
  name: string;
  phone: string;
  date: string;
  time: string;
  partySize: number;
  note?: string;
}): string {
  const lines = [
    "Hello Hillstar Hotel, I would like to reserve a table.",
    "",
    `Name: ${d.name}`,
    `Phone: ${d.phone}`,
    `Date: ${d.date}`,
    `Time: ${d.time}`,
    `Party Size: ${d.partySize}`,
    d.note ? `Notes: ${d.note}` : null,
    "",
    "Thank you!",
  ].filter(Boolean);
  return lines.join("\n") as string;
}

export function buildMeetingInquiryWhatsAppMessage(d: {
  reference: string;
  organization: string;
  contactPerson: string;
  phone: string;
  eventType: string;
  attendees: number;
  preferredDate: string;
}): string {
  const lines = [
    "Hello Hillstar Hotel, I have submitted a meeting & event inquiry.",
    "",
    `Inquiry Reference: ${d.reference}`,
    `Organization: ${d.organization}`,
    `Contact Person: ${d.contactPerson}`,
    `Phone: ${d.phone}`,
    `Event Type: ${d.eventType}`,
    `Expected Attendees: ${d.attendees}`,
    `Preferred Date: ${d.preferredDate}`,
    "",
    "Please contact me to discuss the arrangements. Thank you!",
  ];
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function notifyAdmins(type: string, title: string, message: string, link: string) {
  await db.notification.create({ data: { type, title, message, link } });
}
