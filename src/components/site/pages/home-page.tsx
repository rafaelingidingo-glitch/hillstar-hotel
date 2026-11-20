"use client";

import { useEffect, useMemo, useState } from "react";
import { type PublicContent } from "@/lib/site-hooks";
import { navigate, buildHash } from "@/lib/site-hooks";
import { BookingSearchBar } from "../booking-search-bar";
import { RoomCard } from "../room-card";
import { AmenityIcon } from "../amenity-icon";
import { Lightbox } from "../lightbox";
import { SectionHeading, PrimaryButton, GhostButton, TextLink, Eyebrow } from "../ui-bits";
import { formatTZS, todayStr, addDaysStr } from "@/lib/format";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  MessageCircle,
  ArrowRight,
  Clock,
  UtensilsCrossed,
  Presentation,
  CheckCircle2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Hero carousel
// ---------------------------------------------------------------------------

function HeroCarousel({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % images.length), 6500);
    return () => clearInterval(t);
  }, [images.length]);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {images.map((img, i) => (
        <div
          key={img}
          className={`absolute inset-0 transition-opacity duration-[1600ms] ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className={`h-full w-full bg-cover bg-center ${i === index ? "kenburns" : ""}`}
            style={{ backgroundImage: `url(${img})` }}
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950/70 via-navy-950/35 to-navy-950/85" />
      {images.length > 1 && (
        <div className="absolute bottom-40 right-6 md:right-10 flex gap-2 z-10">
          <button
            onClick={() => setIndex((index - 1 + images.length) % images.length)}
            className="flex h-10 w-10 items-center justify-center border border-ivory/40 bg-navy-950/30 text-ivory backdrop-blur hover:bg-ivory hover:text-navy-950 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIndex((index + 1) % images.length)}
            className="flex h-10 w-10 items-center justify-center border border-ivory/40 bg-navy-950/30 text-ivory backdrop-blur hover:bg-ivory hover:text-navy-950 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="absolute bottom-44 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-1 transition-all duration-300 ${
              i === index ? "w-8 bg-gold-500" : "w-4 bg-ivory/40 hover:bg-ivory/70"
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Home page
// ---------------------------------------------------------------------------

export function HomePage({
  content,
  params,
}: {
  content: PublicContent;
  params: Record<string, string>;
}) {
  const { settings } = content;
  const hero = settings.hero;
  const today = todayStr();

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const galleryImages = useMemo(() => content.gallery.slice(0, 6).map((g) => ({ url: g.url, caption: g.caption })), [content.gallery]);
  const featuredDishes = useMemo(
    () =>
      content.menu
        .flatMap((c) => c.items.map((i) => ({ ...i, categoryName: c.name })))
        .filter((i) => i.featured)
        .slice(0, 3),
    [content.menu]
  );

  return (
    <div>
      {/* ---------------------------------------------------- Hero */}
      <section className="relative min-h-[92vh] flex flex-col justify-center overflow-hidden">
        <HeroCarousel images={hero.images.length > 0 ? hero.images : ["/images/hero-exterior.jpg"]} />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-28 pb-8 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="fade-up text-[11px] font-semibold uppercase tracking-brand text-gold-400">
              Togo Street · Dar es Salaam · Tanzania
            </p>
            <h1 className="fade-up fade-up-delay-1 mt-4 font-display text-[2.6rem] leading-[1.1] md:text-6xl text-ivory text-shadow-hero">
              {hero.headline}
            </h1>
            <p className="fade-up fade-up-delay-2 mt-5 max-w-xl text-[15px] md:text-base leading-relaxed text-ivory/90 text-shadow-hero">
              {hero.subheadline}
            </p>
            <div className="fade-up fade-up-delay-3 mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/booking")}
                className="bg-gold-500 px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-navy-950 hover:bg-gold-400 transition-colors"
              >
                {hero.primaryCta}
              </button>
              <button
                onClick={() => navigate("/about")}
                className="border border-ivory/50 px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-ivory hover:bg-ivory hover:text-navy-950 transition-colors"
              >
                {hero.secondaryCta}
              </button>
            </div>
          </div>
        </div>
        {/* Booking search overlapping hero bottom */}
        <div className="relative z-20 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 mt-6 md:mt-10">
          <BookingSearchBar
            content={content}
            initial={
              params.checkIn
                ? { checkIn: params.checkIn, checkOut: params.checkOut, adults: Number(params.adults) || 2, children: Number(params.children) || 0 }
                : undefined
            }
          />
        </div>
      </section>

      {/* ---------------------------------------------------- Welcome */}
      <section className="bg-ivory py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 lg:order-1">
              <Eyebrow>Karibu — Welcome</Eyebrow>
              <h2 className="mt-3 font-display text-3xl md:text-[2.6rem] leading-[1.15] text-navy-900 gold-underline">
                {settings.welcome.title}
              </h2>
              {settings.welcome.paragraphs.map((p, i) => (
                <p key={i} className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
              <div className="mt-8 grid grid-cols-3 gap-6 max-w-md">
                {[
                  { label: "Guest Rooms", value: `${content.roomCategories.reduce((s, c) => s + c.roomCount, 0)}+` },
                  { label: "Room Types", value: `${content.roomCategories.length}` },
                  { label: "Meeting Spaces", value: `${content.meetingRooms.length}` },
                ].map((stat) => (
                  <div key={stat.label} className="border-l-2 border-gold-500 pl-4">
                    <p className="font-display text-2xl md:text-3xl text-navy-900">{stat.value}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <TextLink label="Discover More" path="/about" />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="relative">
                <div className="aspect-[4/5] max-h-[540px] w-full overflow-hidden bg-sand sm:aspect-[4/3] lg:aspect-[4/5]">
                  { }
                  <img
                    src={settings.welcome.images[0] ?? "/images/hero-lobby.jpg"}
                    alt="Inside Hillstar Hotel"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="absolute -bottom-8 -left-4 sm:-left-8 hidden sm:block w-40 md:w-52 aspect-[3/4] overflow-hidden border-4 border-ivory shadow-xl bg-sand">
                  { }
                  <img
                    src={settings.welcome.images[1] ?? "/images/common-terrace.jpg"}
                    alt="Hillstar common area"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="absolute -top-6 -right-3 sm:-right-5 hidden md:flex h-24 w-24 items-center justify-center bg-navy-900 text-center">
                  <div>
                    <p className="font-display text-lg text-gold-400 leading-none">Karibu</p>
                    <p className="mt-1 text-[8px] uppercase tracking-brand text-ivory/70">Welcome</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- Accommodation preview */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Rooms & Suites"
              title="Choose your room"
              intro="Every room is maintained to the same standard of cleanliness and comfort — pick the space and view that suit your stay."
            />
            <TextLink label="View All Rooms" path="/rooms" />
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {content.roomCategories.slice(0, 3).map((c) => (
              <RoomCard
                key={c.id}
                category={c}
                searchParams={{ checkIn: today, checkOut: addDaysStr(today, 2), adults: 2, children: 0 }}
              />
            ))}
          </div>
          {content.roomCategories.length === 0 && (
            <p className="mt-8 text-sm text-muted-foreground">
              Room categories will appear here once configured in the admin dashboard.
            </p>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------- Restaurant preview */}
      <section className="bg-navy-950 py-20 md:py-28 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="relative">
              <div className="aspect-[4/3] overflow-hidden bg-navy-900">
                { }
                <img
                  src="/images/restaurant-interior.jpg"
                  alt="Hillstar restaurant"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="absolute bottom-6 right-6 bg-gold-500 px-5 py-4 hidden sm:block">
                <p className="font-display text-2xl leading-none text-navy-950">
                  {settings.restaurant.hours[0]?.time.split("–")[0]?.trim() ?? "06:30"}
                </p>
                <p className="mt-1 text-[9px] uppercase tracking-brand text-navy-950/80">Breakfast from</p>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-brand text-gold-400">Restaurant & Dining</p>
              <h2 className="mt-3 font-display text-3xl md:text-[2.6rem] leading-[1.15] text-ivory">
                {settings.restaurant.title}
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-ivory/70">{settings.restaurant.intro}</p>

              <div className="mt-6 flex flex-wrap gap-2">
                {content.menu.map((c) => (
                  <span key={c.id} className="border border-gold-500/40 px-3 py-1.5 text-xs uppercase tracking-wider text-gold-300">
                    {c.name}
                  </span>
                ))}
              </div>

              {featuredDishes.length > 0 && (
                <div className="mt-8 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-brand text-ivory/60">Signature dishes</p>
                  {featuredDishes.map((d) => (
                    <div key={d.id} className="flex items-center gap-4 border-b border-ivory/10 pb-4">
                      <div className="h-14 w-14 shrink-0 overflow-hidden bg-navy-800">
                        {d.image ? (
                           
                          <img src={d.image} alt={d.name} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <UtensilsCrossed className="h-5 w-5 text-gold-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ivory truncate">{d.name}</p>
                        <p className="mt-0.5 text-xs text-ivory/55 line-clamp-1">{d.description}</p>
                      </div>
                      <p className="text-sm font-semibold text-gold-400">{formatTZS(d.price)}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/restaurant")}
                  className="bg-gold-500 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-navy-950 hover:bg-gold-400 transition-colors"
                >
                  View Menu
                </button>
                <button
                  onClick={() => navigate("/restaurant")}
                  className="border border-ivory/40 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-ivory hover:bg-ivory hover:text-navy-950 transition-colors"
                >
                  Reserve a Table
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- Meetings preview */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Meetings & Events"
            title={settings.meetings.title}
            intro={settings.meetings.intro}
            align="center"
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {content.meetingRooms.slice(0, 2).map((m) => (
              <article key={m.id} className="group border border-border/70 bg-card overflow-hidden transition-shadow hover:shadow-lg">
                <div className="aspect-[16/9] overflow-hidden">
                  {m.image ? (
                     
                    <img
                      src={m.image}
                      alt={m.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-sand">
                      <Presentation className="h-8 w-8 text-gold-600" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-xl text-navy-900">{m.name}</h3>
                    <span className="shrink-0 text-xs uppercase tracking-wider text-gold-700">Up to {m.capacity}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-2">{m.description}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {m.seating.slice(0, 4).map((s) => (
                      <span key={s.name} className="bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                        {s.name} · {s.capacity}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
          {content.meetingRooms.length === 0 && (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Meeting spaces will appear here once configured by the hotel.
            </p>
          )}
          <div className="mt-10 text-center">
            <button
              onClick={() => navigate("/meetings")}
              className="inline-flex items-center gap-2 bg-navy-900 px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-ivory hover:bg-navy-800 transition-colors"
            >
              Plan an Event
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- Amenities */}
      <section className="bg-ivory py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Amenities & Services"
            title="Everything for a comfortable stay"
            intro="Thoughtful facilities and services, verified and maintained by our team."
          />
          <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {content.amenities.map((a) => (
              <div key={a.id} className="text-center group">
                <div className="mx-auto flex h-14 w-14 items-center justify-center border border-gold-500/40 bg-card transition-colors group-hover:bg-gold-500/10">
                  <AmenityIcon name={a.icon} className="h-6 w-6 text-gold-700" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-navy-900">{a.name}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- Gallery preview */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow="Gallery" title="A look inside Hillstar" />
            <TextLink label="Full Gallery" path="/gallery" />
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {galleryImages.map((img, i) => (
              <button
                key={img.url + i}
                onClick={() => setLightboxIndex(i)}
                className={`group relative overflow-hidden bg-sand ${
                  i === 0 ? "col-span-2 row-span-2 aspect-square md:aspect-auto md:min-h-[420px]" : "aspect-[4/3]"
                }`}
                aria-label={`Open image: ${img.caption || "gallery"}`}
              >
                { }
                <img
                  src={img.url}
                  alt={img.caption || "Hillstar Hotel"}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                />
                <span className="absolute inset-0 bg-navy-950/0 transition-colors group-hover:bg-navy-950/20" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- Location */}
      <section className="bg-sand/60 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <Eyebrow>Find Us</Eyebrow>
              <h2 className="mt-3 font-display text-3xl md:text-[2.6rem] leading-[1.15] text-navy-900">
                In the heart of Dar es Salaam
              </h2>
              <div className="mt-6 space-y-4">
                <div className="flex gap-4">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-gold-600" />
                  <div>
                    <p className="font-medium text-navy-900">{settings.hotel.address}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Convenient for business districts, government offices and city attractions.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Clock className="mt-1 h-5 w-5 shrink-0 text-gold-600" />
                  <div>
                    <p className="font-medium text-navy-900">24-hour Reception</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Check-in from {settings.booking.checkInTime} · Check-out by {settings.booking.checkOutTime}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Phone className="mt-1 h-5 w-5 shrink-0 text-gold-600" />
                  <div>
                    <p className="font-medium text-navy-900">{settings.hotel.whatsappDisplay}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Call or WhatsApp — we respond quickly.</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <GhostButton href={settings.hotel.mapUrl}>Get Directions</GhostButton>
                <GhostButton
                  href={`https://wa.me/${settings.hotel.whatsapp}?text=${encodeURIComponent("Hello Hillstar Hotel, I would like to ask about a stay.")}`}
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Us
                </GhostButton>
              </div>
            </div>
            <div className="relative h-[320px] md:h-[400px] border border-border bg-card overflow-hidden">
              <iframe
                title="Hillstar Hotel location map — Togo Street, Dar es Salaam"
                src={`https://maps.google.com/maps?q=${encodeURIComponent("Togo Street, Dar es Salaam, Tanzania")}&z=15&output=embed`}
                className="h-full w-full grayscale-[15%]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- Final CTA */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/hero-dining.jpg)" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-navy-950/80" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <CheckCircle2 className="mx-auto h-10 w-10 text-gold-500" strokeWidth={1.25} />
          <h2 className="mt-6 font-display text-3xl md:text-5xl leading-tight text-ivory">
            Your Stay at Hillstar Starts Here.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-ivory/80">
            Request your room in minutes — our team confirms availability directly over WhatsApp. No prepayment required.
          </p>
          <div className="mt-9">
            <PrimaryButton onClick={() => navigate(buildHash("/booking", { checkIn: today, checkOut: addDaysStr(today, 2), adults: 2 }))}>
              Reserve Your Room
            </PrimaryButton>
          </div>
        </div>
      </section>

      {lightboxIndex !== null && (
        <Lightbox
          images={galleryImages}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
