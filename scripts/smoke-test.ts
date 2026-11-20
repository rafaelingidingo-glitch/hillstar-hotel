/**
 * End-to-end API smoke test for the Hillstar booking engine.
 * Run: bun run scripts/smoke-test.ts
 */
const BASE = "http://localhost:3000";
let cookie = "";

async function req(method: string, path: string, body?: unknown) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json, ok: res.ok };
}

function assert(cond: boolean, label: string) {
  if (!cond) {
    console.error(`FAIL: ${label}`);
    process.exitCode = 1;
  } else {
    console.log(`ok: ${label}`);
  }
}

// Unique window per run so repeated runs never collide with prior inventory
const RUN_OFFSET = Math.floor(Math.random() * 200) + 10;
function dateStr(offsetDays: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays + RUN_OFFSET);
  return d.toISOString().slice(0, 10);
}
// Real calendar dates (no run offset) for past-validation & revenue reporting
function realDateStr(offsetDays: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

async function main() {
  // 1. Public content
  const content = await req("GET", "/api/public/content");
  assert(content.ok && content.json.data.roomCategories.length === 4, "content endpoint returns 4 seeded categories");

  const deluxe = content.json.data.roomCategories.find((c: { slug: string }) => c.slug === "deluxe-room");
  assert(!!deluxe, "deluxe-room category exists");

  // 2. Availability search
  const checkIn = dateStr(3);
  const checkOut = dateStr(5);
  const search = await req("POST", "/api/public/availability", { checkIn, checkOut, adults: 2, children: 0, rooms: 1 });
  assert(search.ok, "availability search succeeds");
  const deluxeAv = search.json.data.categories.find((c: { slug: string }) => c.slug === "deluxe-room");
  assert(deluxeAv && deluxeAv.available === 3, `deluxe availability is 3 (got ${deluxeAv?.available})`);
  assert(deluxeAv && deluxeAv.totalForStay === deluxeAv.pricePerNight * 2, "total for stay computed");

  // 3. Past check-in rejected
  const past = await req("POST", "/api/public/availability", { checkIn: realDateStr(-2), checkOut: realDateStr(1), adults: 2, children: 0, rooms: 1 });
  assert(past.status === 400, "past check-in rejected");

  // 4. checkOut before checkIn rejected
  const backwards = await req("POST", "/api/public/availability", { checkIn: dateStr(5), checkOut: dateStr(3), adults: 2, children: 0, rooms: 1 });
  assert(backwards.status === 400, "backwards dates rejected");

  // 5. Over-capacity rejected
  const overCap = await req("POST", "/api/public/bookings", {
    checkIn, checkOut, categoryId: deluxe.id, adults: 5, children: 0, roomsWanted: 1,
    guestName: "Capacity Test", guestPhone: "+255700000001", guestEmail: "",
    specialRequests: "",
  });
  assert(overCap.status === 400, "over-capacity booking rejected");

  // 6. Free rooms for deluxe
  const freeRooms = await req("POST", "/api/public/availability/rooms", { categoryId: deluxe.id, checkIn, checkOut });
  assert(freeRooms.ok && freeRooms.json.data.rooms.length === 3, "free rooms listed");
  const preferredRoomId = freeRooms.json.data.rooms[0].roomId;

  // 7. Create booking request with preferred room
  const booking = await req("POST", "/api/public/bookings", {
    checkIn, checkOut, categoryId: deluxe.id, preferredRoomId, adults: 2, children: 0, roomsWanted: 1,
    guestName: "Amina Juma", guestPhone: "+255712345678", guestEmail: "amina@example.com",
    specialRequests: "High floor please",
  });
  assert(booking.ok && booking.json.data.booking.status === "PENDING", "booking request created as PENDING");
  const ref = booking.json.data.booking.reference;
  assert(/^HST-\d{4}-\d{4}$/.test(ref), `reference format HST-YYYY-NNNN (${ref})`);
  assert(booking.json.data.booking.roomNumber, "specific room assigned to hold");
  assert((booking.json.data.whatsappUrl || "").startsWith("https://wa.me/255725221069"), "WhatsApp URL built to hotel number");
  assert(decodeURIComponent(booking.json.data.whatsappUrl).includes("Amina Juma"), "WhatsApp message includes guest name");

  // 8. Availability dropped by 1 (pending hold)
  const search2 = await req("POST", "/api/public/availability", { checkIn, checkOut, adults: 2, children: 0, rooms: 1 });
  const deluxeAv2 = search2.json.data.categories.find((c: { slug: string }) => c.slug === "deluxe-room");
  assert(deluxeAv2.available === 2, `pending hold reduces availability to 2 (got ${deluxeAv2.available})`);

  // 9. Same preferred room cannot be double-held
  const dup = await req("POST", "/api/public/bookings", {
    checkIn, checkOut, categoryId: deluxe.id, preferredRoomId, adults: 2, children: 0, roomsWanted: 1,
    guestName: "Double Book", guestPhone: "+255712345679", guestEmail: "", specialRequests: "",
  });
  assert(dup.status === 409, `double-holding same room rejected (${dup.status})`);

  // 10. Admin login
  const login = await req("POST", "/api/admin/auth/login", { username: "admin", password: "Hillstar2026!" });
  assert(login.ok, "admin login succeeds");
  const me = await req("GET", "/api/admin/auth/me");
  assert(me.ok && me.json.data.admin.username === "admin", "session cookie works");

  // 11. Unauthorized access blocked
  cookie = "";
  const unauth = await req("GET", "/api/admin/bookings");
  assert(unauth.status === 401, "admin API blocked without session");
  const login2 = await req("POST", "/api/admin/auth/login", { username: "admin", password: "Hillstar2026!" });
  assert(login2.ok, "re-login");
  const badLogin = await req("POST", "/api/admin/auth/login", { username: "admin", password: "wrong" });
  assert(badLogin.status === 401, "wrong password rejected");

  // 12. Confirm the booking (recheck inside transaction)
  const confirm = await req("PATCH", `/api/admin/bookings/${booking.json.data.booking.id}`, { action: "confirm" });
  assert(confirm.ok && confirm.json.data.booking.status === "CONFIRMED", "booking confirmed");

  // 13. Confirm again rejected
  const confirm2 = await req("PATCH", `/api/admin/bookings/${booking.json.data.booking.id}`, { action: "confirm" });
  assert(confirm2.status === 400, "re-confirm rejected");

  // 14. Record a payment
  const pay = await req("POST", `/api/admin/bookings/${booking.json.data.booking.id}/payments`, { amount: 50000, method: "MOBILE_MONEY", reference: "M-PESA 1234", note: "" });
  assert(pay.ok && pay.json.data.paymentStatus === "PARTIAL", "payment recorded as PARTIAL");

  // 15. Dashboard reflects revenue
  const dash = await req("GET", "/api/admin/dashboard");
  assert(dash.ok && dash.json.data.stats.monthlyRevenue >= 50000, "monthly revenue includes payments");
  assert(dash.ok && dash.json.data.stats.confirmedBookings >= 1, "dashboard counts confirmed booking");

  // 16. Second booking for the same room now conflicts on confirm
  const otherRoom = freeRooms.json.data.rooms[1].roomId;
  const b2 = await req("POST", "/api/public/bookings", {
    checkIn, checkOut, categoryId: deluxe.id, adults: 2, children: 0, roomsWanted: 1,
    guestName: "Beta Test", guestPhone: "+255712345680", guestEmail: "", specialRequests: "",
  });
  if (!b2.ok) console.log("  b2 debug:", b2.status, JSON.stringify(b2.json));
  assert(b2.ok, "second booking created");
  // Force its room to the first booking's room by assigning, then confirm -> should 409
  const assign = await req("PATCH", `/api/admin/bookings/${b2.json.data.booking.id}`, { action: "assign_room", roomId: preferredRoomId });
  assert(assign.status === 409, "assigning an already-booked room rejected");

  // Calendar reflects the confirmed hold
  const cal = await req("GET", `/api/admin/calendar?view=week&date=${checkIn}`);
  assert(cal.ok, "calendar loads");
  const roomCell = cal.json.data.rooms.find((r: { number: string }) => r.number === confirm.json.data.booking.roomNumber);
  assert(roomCell && roomCell.cells.some((c: { booking: { reference: string } | null }) => c.booking?.reference === ref), "calendar shows confirmed booking on its room");

  // 17. Check-in / check-out flow
  const checkin = await req("PATCH", `/api/admin/bookings/${booking.json.data.booking.id}`, { action: "check_in" });
  assert(checkin.ok, "check-in works");
  const checkout = await req("PATCH", `/api/admin/bookings/${booking.json.data.booking.id}`, { action: "check_out" });
  assert(checkout.ok, "check-out works");

  // 18. Meeting inquiry
  const meet = await req("POST", "/api/public/meeting-inquiries", {
    organization: "Acme Ltd", contactPerson: "John Doe", email: "j@acme.co.tz", phone: "+255755000111",
    eventType: "Conference", attendees: 40, preferredDate: checkIn, duration: "Full day",
    roomId: null, requirements: "Projector needed",
  });
  assert(meet.ok && /^MTG-\d{4}-\d{4}$/.test(meet.json.data.reference), `meeting inquiry saved with reference ${meet.json.data.reference}`);

  // 19. Table reservation
  const table = await req("POST", "/api/public/table-reservations", {
    name: "Grace Kim", phone: "+255786000222", email: "", date: dateStr(1), time: "19:30", partySize: 4, note: "",
  });
  assert(table.ok, "table reservation saved");

  // 20. Meeting inquiry status update
  const inquiries = await req("GET", "/api/admin/meeting-inquiries");
  assert(inquiries.ok, "meeting inquiries list loads");
  const firstInq = inquiries.json.data.inquiries[0];
  const upd = await req("PATCH", "/api/admin/meeting-inquiries", { id: firstInq.id, status: "QUOTATION_SENT" });
  assert(upd.ok && upd.json.data.inquiry.status === "QUOTATION_SENT", "meeting inquiry status updated");

  // 22. Reports
  const report = await req("GET", `/api/admin/reports?type=revenue&from=${realDateStr(-30)}&to=${realDateStr(1)}`);
  assert(report.ok && report.json.data.rows.length >= 1, "revenue report has rows");
  const csv = await fetch(`${BASE}/api/admin/reports?type=revenue&format=csv&from=${realDateStr(-30)}&to=${realDateStr(1)}`, { headers: { Cookie: cookie } });
  const csvText = await csv.text();
  assert(csvText.split("\n")[0].includes("AmountTZS"), "CSV export works");

  // 23. Room category CRUD
  const newCat = await req("POST", "/api/admin/categories", {
    name: "Test Suite", pricePerNight: 100000, maxAdults: 2, maxChildren: 1, maxTotalGuests: 3,
    bedConfiguration: "1 King Bed", description: "Test", tagline: "", amenities: ["Wi-Fi"],
    coverImage: "", images: [], featured: false, active: true, sortOrder: 99,
  });
  assert(newCat.ok, "category created");
  const newRoom = await req("POST", "/api/admin/rooms", { number: "T901", categoryId: newCat.json.data.category.id, floor: "9", notes: "", status: "AVAILABLE" });
  assert(newRoom.ok, "room created");
  const avail3 = await req("POST", "/api/public/availability", { checkIn, checkOut, adults: 2, children: 0, rooms: 1 });
  const testAv = avail3.json.data.categories.find((c: { slug: string }) => c.slug === "test-suite");
  assert(testAv && testAv.available === 1, "new room immediately searchable");
  const delRoom = await req("DELETE", `/api/admin/rooms/${newRoom.json.data.room.id}`);
  assert(delRoom.ok, "room deleted");
  const delCat = await req("DELETE", `/api/admin/categories/${newCat.json.data.category.id}`);
  assert(delCat.ok, "category deleted");

  // 24. Pending expiration: create booking then force expiry via maintenance endpoint won't work (15 min window).
  // Instead verify the booking appears with expiresAt and the sweep endpoint responds.
  const b3 = await req("POST", "/api/public/bookings", {
    checkIn, checkOut, categoryId: deluxe.id, adults: 2, children: 0, roomsWanted: 1,
    guestName: "Expiry Test", guestPhone: "+255712345681", guestEmail: "", specialRequests: "",
  });
  if (!b3.ok) console.log("  b3 debug:", b3.status, JSON.stringify(b3.json));
  assert(b3.ok && b3.json.data.booking.expiresAt, "pending booking has expiresAt");
  const expire = await req("POST", "/api/admin/maintenance/expire");
  assert(expire.ok, "manual expiry sweep responds");

  // 25. Notifications
  const notifs = await req("GET", "/api/admin/notifications");
  assert(notifs.ok && notifs.json.data.notifications.length >= 2, "notifications generated for booking + inquiry");

  // 26. Rate limiting on login (8 per 5 min) — only verify endpoint still responds
  const rl = await req("POST", "/api/admin/auth/login", { username: "x", password: "y" });
  assert(rl.status === 401 || rl.status === 429, "login rate limit path responds");

  console.log("\nSMOKE TEST COMPLETE");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
