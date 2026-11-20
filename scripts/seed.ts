/**
 * Seed script — creates the admin account and sample, fully-editable content.
 * All sample data is clearly labelled as SAMPLE inside the admin dashboard and
 * can be edited or replaced by the hotel without touching code.
 *
 * Run: bun run scripts/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  // ---------------------------------------------------------------- Admin
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "Hillstar2026!";
  const existingAdmin = await db.adminUser.findUnique({ where: { username: adminUsername } });
  if (!existingAdmin) {
    await db.adminUser.create({
      data: {
        username: adminUsername,
        email: process.env.ADMIN_EMAIL || "admin@hillstarhotel.co.tz",
        name: "Hillstar Reservations",
        passwordHash: hashPassword(adminPassword),
        role: "ADMIN",
      },
    });
    console.log(`Seeded admin user "${adminUsername}"`);
  }

  // ------------------------------------------------------- Room categories
  const categories = [
    {
      slug: "standard-room",
      name: "Standard Room",
      tagline: "Comfortable essentials for a restful stay",
      description:
        "A comfortable, well-kept room with everything you need after a day in the city — a plush queen bed, work-friendly desk, and a refreshing en-suite shower.",
      pricePerNight: 85000,
      maxAdults: 2,
      maxChildren: 1,
      maxTotalGuests: 3,
      bedConfiguration: "1 Queen Bed",
      sizeSqm: 22,
      amenities: ["Air Conditioning", "Free Wi-Fi", "Flat-screen TV", "En-suite Bathroom", "Work Desk", "Daily Housekeeping"],
      coverImage: "/images/room-standard.jpg",
      images: ["/images/room-standard.jpg", "/images/room-bathroom.jpg", "/images/gallery-corridor.jpg"],
      featured: false,
      sortOrder: 1,
      rooms: ["101", "102", "103", "104"],
      floors: ["1", "1", "1", "1"],
    },
    {
      slug: "deluxe-room",
      name: "Deluxe Room",
      tagline: "Extra space, elevated comfort",
      description:
        "A spacious room designed for relaxation, featuring a king bed, a cosy seating corner, and large windows that fill the space with natural light.",
      pricePerNight: 120000,
      maxAdults: 2,
      maxChildren: 2,
      maxTotalGuests: 4,
      bedConfiguration: "1 King Bed",
      sizeSqm: 30,
      amenities: ["Air Conditioning", "Free Wi-Fi", "Flat-screen TV", "Mini Fridge", "Seating Area", "Coffee & Tea Set", "Daily Housekeeping"],
      coverImage: "/images/room-deluxe.jpg",
      images: ["/images/room-deluxe.jpg", "/images/room-bathroom.jpg"],
      featured: true,
      sortOrder: 2,
      rooms: ["201", "202", "203"],
      floors: ["2", "2", "2"],
    },
    {
      slug: "executive-suite",
      name: "Executive Suite",
      tagline: "Our finest stay for business and leisure",
      description:
        "A refined suite with a separate lounge area — ideal for unwinding or hosting an informal meeting. Layered textures, warm lighting and thoughtful details throughout.",
      pricePerNight: 180000,
      maxAdults: 2,
      maxChildren: 2,
      maxTotalGuests: 4,
      bedConfiguration: "1 King Bed + Sofa",
      sizeSqm: 42,
      amenities: ["Air Conditioning", "Free Wi-Fi", "Flat-screen TV", "Mini Bar", "Lounge Area", "Bathrobes & Slippers", "Complimentary Water", "Daily Housekeeping"],
      coverImage: "/images/room-executive.jpg",
      images: ["/images/room-executive.jpg", "/images/room-bathroom.jpg", "/images/common-terrace.jpg"],
      featured: true,
      sortOrder: 3,
      rooms: ["301", "302"],
      floors: ["3", "3"],
    },
    {
      slug: "twin-room",
      name: "Twin Room",
      tagline: "Flexible comfort for friends and colleagues",
      description:
        "Two comfortable single beds make this room a smart choice for colleagues or friends travelling together, with all the essentials of a Hillstar stay.",
      pricePerNight: 95000,
      maxAdults: 2,
      maxChildren: 1,
      maxTotalGuests: 3,
      bedConfiguration: "2 Single Beds",
      sizeSqm: 24,
      amenities: ["Air Conditioning", "Free Wi-Fi", "Flat-screen TV", "Reading Lights", "Daily Housekeeping"],
      coverImage: "/images/room-twin.jpg",
      images: ["/images/room-twin.jpg", "/images/room-bathroom.jpg"],
      featured: false,
      sortOrder: 4,
      rooms: ["105", "205"],
      floors: ["1", "2"],
    },
  ];

  for (const c of categories) {
    const existing = await db.roomCategory.findUnique({ where: { slug: c.slug } });
    if (existing) continue;
    const { rooms, floors, ...catData } = c;
    const created = await db.roomCategory.create({
      data: {
        ...catData,
        amenities: JSON.stringify(catData.amenities),
        images: JSON.stringify(catData.images),
      },
    });
    for (let i = 0; i < rooms.length; i++) {
      await db.room.create({
        data: {
          number: rooms[i],
          categoryId: created.id,
          floor: floors[i] || "",
          status: "AVAILABLE",
        },
      });
    }
    console.log(`Seeded category ${c.name} with ${rooms.length} rooms`);
  }

  // One room out for maintenance to demonstrate the maintenance state
  const maintenanceRoom = await db.room.findUnique({ where: { number: "104" } });
  if (maintenanceRoom && maintenanceRoom.status === "AVAILABLE") {
    await db.room.update({ where: { id: maintenanceRoom.id }, data: { status: "MAINTENANCE", notes: "Sample: scheduled deep cleaning" } });
  }

  // ------------------------------------------------------------ Restaurant
  const menuCategories = [
    {
      name: "Breakfast",
      description: "Start your day right — served 06:30 to 10:00",
      sortOrder: 1,
      items: [
        { name: "Full Hillstar Breakfast", description: "Eggs any style, grilled tomatoes, toast, sausage and fresh tropical fruit.", price: 15000, image: "/images/dish-breakfast.jpg", featured: true },
        { name: "Spanish Omelette", description: "Three-egg omelette with peppers, onions and cheese, served with toast.", price: 10000, image: "" },
        { name: "Paratha & Chai", description: "Flaky layered parathas with spiced Kenyan chai.", price: 8000, image: "" },
        { name: "Fresh Fruit Platter", description: "Seasonal tropical fruits — mango, pineapple, banana and watermelon.", price: 7000, image: "" },
      ],
    },
    {
      name: "Mains",
      description: "East African favourites and continental classics",
      sortOrder: 2,
      items: [
        { name: "Grilled Tilapia & Coconut Rice", description: "Fresh tilapia grilled with Swahili spices, served on creamy coconut rice.", price: 22000, image: "/images/dish-grilled-fish.jpg", featured: true },
        { name: "Beef Pilau", description: "Aromatic rice slow-cooked with tender beef, cardamom and cloves.", price: 18000, image: "/images/dish-pilau.jpg", featured: true },
        { name: "Chicken Tikka", description: "Char-grilled marinated chicken with mint chutney and salad.", price: 16000, image: "" },
        { name: "Chips Mayai", description: "Dar es Salaam's beloved egg-and-chips omelette, with kachumbari.", price: 9000, image: "" },
        { name: "Vegetable Curry & Chapati", description: "Seasonal vegetables in a rich coconut curry with fresh chapati.", price: 14000, image: "" },
      ],
    },
    {
      name: "Coffee & Snacks",
      description: "All-day coffee, tea and light bites",
      sortOrder: 3,
      items: [
        { name: "Cappuccino", description: "Double shot espresso with steamed milk, Tanzanian beans.", price: 5000, image: "/images/dish-coffee.jpg", featured: true },
        { name: "Tangawizi Tea", description: "Ginger tea with honey — a local classic.", price: 3000, image: "" },
        { name: "Banana Fritters", description: "Sweet fried plantain fritters with a dusting of cinnamon sugar.", price: 6000, image: "" },
        { name: "Samosas (3 pcs)", description: "Crispy pastry with spiced beef or vegetable filling.", price: 5000, image: "" },
      ],
    },
  ];

  for (const mc of menuCategories) {
    const exists = await db.menuCategory.findFirst({ where: { name: mc.name } });
    if (exists) continue;
    const { items, ...catData } = mc;
    const created = await db.menuCategory.create({ data: catData });
    let i = 0;
    for (const item of items) {
      await db.menuItem.create({
        data: { ...item, categoryId: created.id, sortOrder: i++ },
      });
    }
    console.log(`Seeded menu category ${mc.name}`);
  }

  // ------------------------------------------------------------ Meetings
  const meetingRooms = [
    {
      slug: "hillstar-conference-room",
      name: "Hillstar Conference Room",
      description:
        "Our main conference room seats up to 60 guests with a large presentation screen, dedicated sound system and natural daylight. Ideal for seminars, trainings and corporate meetings.",
      capacity: 60,
      seating: [
        { name: "Theatre Style", capacity: 60 },
        { name: "Classroom Style", capacity: 36 },
        { name: "U-Shape", capacity: 24 },
        { name: "Boardroom", capacity: 20 },
      ],
      equipment: ["Projector & Screen", "Sound System", "Wireless Microphone", "Flip Chart", "Air Conditioning", "Complimentary Water"],
      image: "/images/meeting-room.jpg",
      pricingNote: "Half-day and full-day packages available — includes tea break service.",
      hourlyRate: 60000,
      sortOrder: 1,
    },
    {
      slug: "executive-boardroom",
      name: "Executive Boardroom",
      description:
        "An intimate, fully air-conditioned boardroom for up to 12 executives, with an oval table, leather seating and city views — designed for focused decision-making.",
      capacity: 12,
      seating: [
        { name: "Boardroom", capacity: 12 },
        { name: "U-Shape", capacity: 10 },
      ],
      equipment: ["65-inch Display", "Video Conferencing Ready", "Whiteboard", "Air Conditioning", "Complimentary Water & Coffee"],
      image: "/images/meeting-boardroom.jpg",
      pricingNote: "Quoted per session — refreshments can be arranged.",
      hourlyRate: null,
      sortOrder: 2,
    },
  ];

  for (const m of meetingRooms) {
    const exists = await db.meetingRoom.findUnique({ where: { slug: m.slug } });
    if (exists) continue;
    const { seating, equipment, ...roomData } = m;
    await db.meetingRoom.create({
      data: { ...roomData, seating: JSON.stringify(seating), equipment: JSON.stringify(equipment) },
    });
    console.log(`Seeded meeting room ${m.name}`);
  }

  // -------------------------------------------------------------- Gallery
  const gallery = [
    { url: "/images/hero-exterior.jpg", caption: "Hillstar Hotel at dusk", category: "EXTERIOR", sortOrder: 1 },
    { url: "/images/hero-lobby.jpg", caption: "The lobby lounge", category: "COMMON", sortOrder: 2 },
    { url: "/images/room-deluxe.jpg", caption: "Deluxe Room", category: "ROOMS", sortOrder: 3 },
    { url: "/images/room-standard.jpg", caption: "Standard Room", category: "ROOMS", sortOrder: 4 },
    { url: "/images/room-executive.jpg", caption: "Executive Suite", category: "ROOMS", sortOrder: 5 },
    { url: "/images/room-twin.jpg", caption: "Twin Room", category: "ROOMS", sortOrder: 6 },
    { url: "/images/room-bathroom.jpg", caption: "En-suite bathroom", category: "ROOMS", sortOrder: 7 },
    { url: "/images/restaurant-interior.jpg", caption: "The restaurant", category: "RESTAURANT", sortOrder: 8 },
    { url: "/images/dish-grilled-fish.jpg", caption: "Grilled tilapia with coconut rice", category: "RESTAURANT", sortOrder: 9 },
    { url: "/images/dish-breakfast.jpg", caption: "Full Hillstar breakfast", category: "RESTAURANT", sortOrder: 10 },
    { url: "/images/meeting-room.jpg", caption: "Hillstar Conference Room", category: "MEETINGS", sortOrder: 11 },
    { url: "/images/meeting-boardroom.jpg", caption: "Executive Boardroom", category: "MEETINGS", sortOrder: 12 },
    { url: "/images/common-terrace.jpg", caption: "Garden terrace", category: "COMMON", sortOrder: 13 },
    { url: "/images/gallery-poolside.jpg", caption: "Courtyard pool at dusk", category: "COMMON", sortOrder: 14 },
    { url: "/images/gallery-corridor.jpg", caption: "Guest room corridor", category: "COMMON", sortOrder: 15 },
    { url: "/images/about-reception.jpg", caption: "Reception", category: "EXPERIENCES", sortOrder: 16 },
    { url: "/images/hero-dining.jpg", caption: "Evenings at the restaurant", category: "RESTAURANT", sortOrder: 17 },
  ];

  const galleryCount = await db.galleryImage.count();
  if (galleryCount === 0) {
    for (const g of gallery) {
      await db.galleryImage.create({ data: g });
    }
    console.log(`Seeded ${gallery.length} gallery images`);
  }

  // ------------------------------------------------------------ Amenities
  const amenities = [
    { name: "Free Wi-Fi", description: "High-speed internet throughout the hotel", icon: "Wifi", sortOrder: 1 },
    { name: "Restaurant", description: "Breakfast, lunch and dinner served daily", icon: "UtensilsCrossed", sortOrder: 2 },
    { name: "Meeting Facilities", description: "Conference room and executive boardroom", icon: "Presentation", sortOrder: 3 },
    { name: "24-hour Reception", description: "Our front desk is always attended", icon: "ConciergeBell", sortOrder: 4 },
    { name: "Air Conditioning", description: "Climate-controlled comfort in every room", icon: "AirVent", sortOrder: 5 },
    { name: "Room Service", description: "Enjoy selected menu items in your room", icon: "BellRing", sortOrder: 6 },
    { name: "On-site Parking", description: "Secure parking for hotel guests", icon: "CarFront", sortOrder: 7 },
    { name: "Security", description: "Trained staff and monitored premises", icon: "ShieldCheck", sortOrder: 8 },
    { name: "Daily Housekeeping", description: "Rooms refreshed and serviced every day", icon: "Sparkles", sortOrder: 9 },
  ];
  const amenityCount = await db.amenity.count();
  if (amenityCount === 0) {
    for (const a of amenities) {
      await db.amenity.create({ data: a });
    }
    console.log(`Seeded ${amenities.length} amenities`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
