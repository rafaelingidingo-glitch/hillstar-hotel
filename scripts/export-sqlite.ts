/**
 * One-off migration helper.
 *
 * Dumps every table of the legacy SQLite database into db/export.json so the
 * data can be imported into the new PostgreSQL (Neon) database with
 * scripts/import-data.ts.
 *
 * Run BEFORE switching prisma/schema.prisma to the postgresql provider:
 *   bun run scripts/export-sqlite.ts
 */
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const db = new PrismaClient();

async function main() {
  const [
    adminUsers,
    roomCategories,
    rooms,
    bookings,
    payments,
    menuCategories,
    menuItems,
    restaurantInquiries,
    meetingRooms,
    meetingInquiries,
    galleryImages,
    amenities,
    settings,
    notifications,
  ] = await Promise.all([
    db.adminUser.findMany(),
    db.roomCategory.findMany(),
    db.room.findMany(),
    db.booking.findMany(),
    db.payment.findMany(),
    db.menuCategory.findMany(),
    db.menuItem.findMany(),
    db.restaurantInquiry.findMany(),
    db.meetingRoom.findMany(),
    db.meetingInquiry.findMany(),
    db.galleryImage.findMany(),
    db.amenity.findMany(),
    db.setting.findMany(),
    db.notification.findMany(),
  ]);

  console.table({
    adminUsers: adminUsers.length,
    roomCategories: roomCategories.length,
    rooms: rooms.length,
    bookings: bookings.length,
    payments: payments.length,
    menuCategories: menuCategories.length,
    menuItems: menuItems.length,
    restaurantInquiries: restaurantInquiries.length,
    meetingRooms: meetingRooms.length,
    meetingInquiries: meetingInquiries.length,
    galleryImages: galleryImages.length,
    amenities: amenities.length,
    settings: settings.length,
    notifications: notifications.length,
  });

  // Sanity check: flag any rows that still reference legacy local /uploads/ files
  const uploadRefs: string[] = [];
  const scan = (label: string, rows: Record<string, unknown>[], fields: string[]) => {
    for (const row of rows) {
      for (const f of fields) {
        const v = row[f];
        if (typeof v === "string" && v.includes("/uploads/")) {
          uploadRefs.push(`${label}#${row.id} ${f}=${v}`);
        } else if (typeof v === "string" && (v.startsWith("[") || v.startsWith("{"))) {
          if (v.includes("/uploads/")) uploadRefs.push(`${label}#${row.id} ${f}(json)=${v}`);
        }
      }
    }
  };
  scan("RoomCategory", roomCategories as unknown as Record<string, unknown>[], ["coverImage", "images"]);
  scan("MenuItem", menuItems as unknown as Record<string, unknown>[], ["image"]);
  scan("MeetingRoom", meetingRooms as unknown as Record<string, unknown>[], ["image"]);
  scan("GalleryImage", galleryImages as unknown as Record<string, unknown>[], ["url"]);
  if (uploadRefs.length > 0) {
    console.warn(`Found ${uploadRefs.length} legacy /uploads/ references:`);
    for (const r of uploadRefs) console.warn("  " + r);
  } else {
    console.log("No legacy /uploads/ references found — clean.");
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    adminUsers,
    roomCategories,
    rooms,
    bookings,
    payments,
    menuCategories,
    menuItems,
    restaurantInquiries,
    meetingRooms,
    meetingInquiries,
    galleryImages,
    amenities,
    settings,
    notifications,
  };
  const out = path.join(process.cwd(), "db", "export.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(payload, null, 2));
  console.log(`Wrote ${out}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
