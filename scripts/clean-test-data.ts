import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Prefer .env values over any pre-existing environment variables.
for (const line of fs.readFileSync(path.join(process.cwd(), ".env"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)\s*$/);
  if (m && !line.trim().startsWith("#")) process.env[m[1]] = m[2];
}

const db = new PrismaClient();
async function main() {
  const payments = await db.payment.deleteMany({});
  const bookings = await db.booking.deleteMany({});
  const meetings = await db.meetingInquiry.deleteMany({});
  const tables = await db.restaurantInquiry.deleteMany({});
  const notifs = await db.notification.deleteMany({});
  console.log(`cleaned: ${payments.count} payments, ${bookings.count} bookings, ${meetings.count} meeting inquiries, ${tables.count} table inquiries, ${notifs.count} notifications`);
}
main().finally(() => db.$disconnect());
