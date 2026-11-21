/**
 * One-off migration helper.
 *
 * Imports db/export.json (produced by scripts/export-sqlite.ts) into the
 * currently configured database (Neon PostgreSQL). Idempotent — every row is
 * upserted by its primary key, so re-running the script is safe.
 *
 * Run AFTER prisma db push has created the tables:
 *   bun run scripts/import-data.ts
 */
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Force .env values over any pre-existing environment variables (some hosts
// export a legacy DATABASE_URL globally — the .env file is the local source
// of truth for one-off scripts).
// ---------------------------------------------------------------------------
for (const line of fs.readFileSync(path.join(process.cwd(), ".env"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)\s*$/);
  if (m && !line.trim().startsWith("#")) process.env[m[1]] = m[2];
}

const db = new PrismaClient();

type Row = Record<string, unknown>;

// Columns that are serialized as ISO strings in the JSON dump.
const DATE_COLUMNS = new Set([
  "createdAt",
  "updatedAt",
  "lastLoginAt",
  "checkIn",
  "checkOut",
  "expiresAt",
  "confirmedAt",
  "checkedInAt",
  "checkedOutAt",
  "closedAt",
  "recordedAt",
]);

function revive(row: Row): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = DATE_COLUMNS.has(k) && typeof v === "string" ? new Date(v) : v;
  }
  return out;
}

// Prisma delegates are heavily generic; for a one-off migration script an
// untyped upsert facade is the pragmatic choice.
type UpsertDelegate = { upsert: (args: any) => Promise<unknown> };

async function upsertAll(delegate: UpsertDelegate, rows: Row[]): Promise<number> {
  let n = 0;
  for (const raw of rows) {
    const row = revive(raw);
    await delegate.upsert({
      where: { id: row.id as string },
      create: row,
      update: row,
    });
    n++;
  }
  return n;
}

async function main() {
  const file = path.join(process.cwd(), "db", "export.json");
  if (!fs.existsSync(file)) {
    throw new Error(`Missing ${file} — run scripts/export-sqlite.ts first.`);
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, Row[]>;

  // Insert in dependency order so foreign keys resolve.
  await upsertAll(db.adminUser, data.adminUsers || []);
  await upsertAll(db.roomCategory, data.roomCategories || []);
  await upsertAll(db.room, data.rooms || []);
  await upsertAll(db.booking, data.bookings || []);
  await upsertAll(db.payment, data.payments || []);
  await upsertAll(db.menuCategory, data.menuCategories || []);
  await upsertAll(db.menuItem, data.menuItems || []);
  await upsertAll(db.restaurantInquiry, data.restaurantInquiries || []);
  await upsertAll(db.meetingRoom, data.meetingRooms || []);
  await upsertAll(db.meetingInquiry, data.meetingInquiries || []);
  await upsertAll(db.galleryImage, data.galleryImages || []);
  await upsertAll(db.amenity, data.amenities || []);
  await upsertAll(db.setting, data.settings || []);
  await upsertAll(db.notification, data.notifications || []);

  const [admins, categories, rooms, bookings, menuItems, meetingRooms, gallery] = await Promise.all([
    db.adminUser.count(),
    db.roomCategory.count(),
    db.room.count(),
    db.booking.count(),
    db.menuItem.count(),
    db.meetingRoom.count(),
    db.galleryImage.count(),
  ]);
  console.log(`Import complete. Neon now contains: ${admins} admins, ${categories} categories, ${rooms} rooms, ${bookings} bookings, ${menuItems} menu items, ${meetingRooms} meeting rooms, ${gallery} gallery images.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
