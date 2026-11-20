"use client";

import { type PublicContent, usePageMeta, navigate } from "@/lib/site-hooks";
import { PageHero, PrimaryButton } from "../ui-bits";
import { HeartHandshake, BedDouble, UtensilsCrossed, Presentation } from "lucide-react";

export function AboutPage({ content }: { content: PublicContent }) {
  const about = content.settings.about;
  usePageMeta(
    "About Hillstar",
    about.story[0]?.slice(0, 150) ?? "About Hillstar Hotel, Dar es Salaam.",
    "/images/about-reception.jpg"
  );

  return (
    <div>
      <PageHero
        image="/images/about-reception.jpg"
        eyebrow="About Hillstar"
        title={about.title}
        intro={about.story[0]}
      />

      {/* Story */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-5">
              {about.story.slice(1).map((p, i) => (
                <p key={i} className="text-[15px] leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
              <div className="grid gap-6 pt-4 sm:grid-cols-2">
                <div className="border-l-2 border-gold-500 pl-4">
                  <p className="text-xs font-semibold uppercase tracking-brand text-gold-700">Our Mission</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{about.mission}</p>
                </div>
                <div className="border-l-2 border-gold-500 pl-4">
                  <p className="text-xs font-semibold uppercase tracking-brand text-gold-700">Our Vision</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{about.vision}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              { }
              <img src="/images/hero-lobby.jpg" alt="Hillstar lobby" loading="lazy" className="aspect-[3/4] w-full object-cover" />
              { }
              <img src="/images/common-terrace.jpg" alt="Hillstar terrace" loading="lazy" className="mt-8 aspect-[3/4] w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-ivory py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-brand text-gold-600">What we stand for</p>
            <h2 className="mt-3 font-display text-3xl text-navy-900">Values that shape every stay</h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {about.values.map((v, i) => (
              <div key={v.title} className="border border-border/70 bg-card p-6 text-center">
                <span className="font-display text-3xl text-gold-500/60">0{i + 1}</span>
                <h3 className="mt-3 font-display text-lg text-navy-900">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we offer */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-brand text-gold-600">One address, three experiences</p>
            <h2 className="mt-3 font-display text-3xl text-navy-900">Stay. Dine. Meet.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: <BedDouble className="h-6 w-6" strokeWidth={1.5} />,
                title: "Accommodation",
                text: "Comfortable rooms across several categories, maintained daily and equipped for rest and work.",
                path: "/rooms",
                cta: "View Rooms",
              },
              {
                icon: <UtensilsCrossed className="h-6 w-6" strokeWidth={1.5} />,
                title: "Restaurant & Dining",
                text: "Freshly prepared breakfasts, lunches and dinners — East African favourites and continental classics.",
                path: "/restaurant",
                cta: "See the Menu",
              },
              {
                icon: <Presentation className="h-6 w-6" strokeWidth={1.5} />,
                title: "Meetings & Events",
                text: "A well-equipped conference room and executive boardroom for productive corporate gatherings.",
                path: "/meetings",
                cta: "Explore Spaces",
              },
            ].map((c) => (
              <div key={c.title} className="group flex flex-col border border-border/70 bg-card p-7 transition-shadow hover:shadow-lg">
                <span className="flex h-12 w-12 items-center justify-center border border-gold-500/40 text-gold-700">
                  {c.icon}
                </span>
                <h3 className="mt-5 font-display text-xl text-navy-900">{c.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{c.text}</p>
                <button
                  onClick={() => navigate(c.path)}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gold-700 hover:text-gold-600"
                >
                  {c.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy-950 py-16 md:py-20">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-4 text-center sm:px-6">
          <HeartHandshake className="h-10 w-10 text-gold-500" strokeWidth={1.25} />
          <h2 className="mt-5 font-display text-3xl md:text-4xl text-ivory">We look forward to welcoming you</h2>
          <p className="mt-3 max-w-xl text-[15px] text-ivory/70">
            {content.settings.hotel.address}
          </p>
          <div className="mt-8">
            <PrimaryButton onClick={() => navigate("/booking")}>Book Your Stay</PrimaryButton>
          </div>
        </div>
      </section>
    </div>
  );
}
