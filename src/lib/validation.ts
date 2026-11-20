import { z } from "zod";

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use date format YYYY-MM-DD");

export const availabilitySearchSchema = z.object({
  checkIn: dateStr,
  checkOut: dateStr,
  adults: z.coerce.number().int().min(1).max(10),
  children: z.coerce.number().int().min(0).max(10).default(0),
  rooms: z.coerce.number().int().min(1).max(5).default(1),
});

export const bookingRequestSchema = z.object({
  checkIn: dateStr,
  checkOut: dateStr,
  categoryId: z.string().min(1),
  preferredRoomId: z.string().optional().nullable(),
  adults: z.coerce.number().int().min(1).max(10),
  children: z.coerce.number().int().min(0).max(10).default(0),
  roomsWanted: z.coerce.number().int().min(1).max(5).default(1),
  guestName: z.string().trim().min(2, "Full name is required").max(120),
  guestPhone: z
    .string()
    .trim()
    .min(7, "A valid phone number is required")
    .max(24)
    .regex(/^[+0-9()\s-]+$/, "Phone number contains invalid characters"),
  guestEmail: z.union([z.string().trim().email("Invalid email address"), z.literal("")]).optional(),
  specialRequests: z.string().trim().max(1000).optional().default(""),
});

export const meetingInquirySchema = z.object({
  organization: z.string().trim().min(2, "Organization name is required").max(160),
  contactPerson: z.string().trim().min(2, "Contact person is required").max(120),
  email: z.string().trim().email("A valid email is required"),
  phone: z
    .string()
    .trim()
    .min(7, "A valid phone number is required")
    .max(24)
    .regex(/^[+0-9()\s-]+$/, "Phone number contains invalid characters"),
  eventType: z.string().trim().min(2).max(80),
  attendees: z.coerce.number().int().min(1).max(1000),
  preferredDate: z.string().trim().max(60).default(""),
  duration: z.string().trim().max(80).default(""),
  roomId: z.string().optional().nullable(),
  requirements: z.string().trim().max(2000).default(""),
});

export const tableReservationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(24)
    .regex(/^[+0-9()\s-]+$/, "Phone number contains invalid characters"),
  email: z.union([z.string().trim().email("Invalid email"), z.literal("")]).optional(),
  date: dateStr,
  time: z.string().trim().min(3).max(20),
  partySize: z.coerce.number().int().min(1).max(30),
  note: z.string().trim().max(500).default(""),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required").max(80),
  password: z.string().min(1, "Password is required").max(200),
});

export const adminActionSchema = z.object({
  action: z.enum([
    "confirm",
    "reject",
    "cancel",
    "check_in",
    "check_out",
    "no_show",
    "extend",
    "assign_room",
    "set_notes",
    "update_details",
  ]),
  roomId: z.string().optional().nullable(),
  extendMinutes: z.coerce.number().int().min(5).max(2880).optional(),
  notes: z.string().max(2000).optional(),
  // for update_details
  guestName: z.string().trim().min(2).max(120).optional(),
  guestPhone: z.string().trim().min(7).max(24).optional(),
  guestEmail: z.string().trim().max(120).optional(),
  adults: z.coerce.number().int().min(1).max(10).optional(),
  children: z.coerce.number().int().min(0).max(10).optional(),
  checkIn: dateStr.optional(),
  checkOut: dateStr.optional(),
});

export const paymentSchema = z.object({
  amount: z.coerce.number().int().min(1, "Amount must be greater than zero"),
  method: z.enum(["CASH", "MOBILE_MONEY", "BANK", "CARD", "OTHER"]),
  reference: z.string().trim().max(120).default(""),
  note: z.string().trim().max(500).default(""),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and dashes")
    .max(120)
    .optional(),
  tagline: z.string().trim().max(200).default(""),
  description: z.string().trim().max(4000).default(""),
  pricePerNight: z.coerce.number().int().min(0),
  maxAdults: z.coerce.number().int().min(1).max(10),
  maxChildren: z.coerce.number().int().min(0).max(10).default(0),
  maxTotalGuests: z.coerce.number().int().min(1).max(20),
  bedConfiguration: z.string().trim().max(160).default(""),
  sizeSqm: z.coerce.number().int().min(0).max(2000).optional().nullable(),
  amenities: z.array(z.string().trim().max(80)).max(30).default([]),
  coverImage: z.string().trim().max(400).default(""),
  images: z.array(z.string().trim().max(400)).max(12).default([]),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const roomSchema = z.object({
  number: z.string().trim().min(1, "Room number is required").max(20),
  categoryId: z.string().min(1, "Category is required"),
  floor: z.string().trim().max(60).default(""),
  notes: z.string().trim().max(500).default(""),
  status: z.enum(["AVAILABLE", "MAINTENANCE", "INACTIVE"]).default("AVAILABLE"),
});

export const menuCategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).default(""),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  active: z.boolean().default(true),
});

export const menuItemSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).default(""),
  price: z.coerce.number().int().min(0),
  image: z.string().trim().max(400).default(""),
  available: z.boolean().default(true),
  featured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const meetingRoomSchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and dashes")
    .max(160)
    .optional(),
  description: z.string().trim().max(3000).default(""),
  capacity: z.coerce.number().int().min(1).max(2000),
  seating: z.array(z.object({ name: z.string().trim().max(80), capacity: z.coerce.number().int().min(1).max(2000) })).max(10).default([]),
  equipment: z.array(z.string().trim().max(80)).max(30).default([]),
  image: z.string().trim().max(400).default(""),
  pricingNote: z.string().trim().max(500).default(""),
  hourlyRate: z.coerce.number().int().min(0).max(100000000).optional().nullable(),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const gallerySchema = z.object({
  url: z.string().trim().min(1).max(400),
  caption: z.string().trim().max(200).default(""),
  category: z.enum(["ROOMS", "RESTAURANT", "MEETINGS", "EXTERIOR", "COMMON", "EXPERIENCES"]).default("EXPERIENCES"),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  active: z.boolean().default(true),
});

export const amenitySchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(300).default(""),
  icon: z.string().trim().max(60).default("Check"),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  active: z.boolean().default(true),
});

export const inquiryStatusSchema = z.object({
  status: z.string().trim().min(1).max(40),
  adminNotes: z.string().trim().max(2000).optional(),
});

export const adminBookingCreateSchema = bookingRequestSchema.extend({
  status: z.enum(["PENDING", "CONFIRMED"]).default("PENDING"),
  adminNotes: z.string().trim().max(2000).default(""),
});
