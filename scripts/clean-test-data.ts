import { PrismaClient } from "@prisma/client";
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
