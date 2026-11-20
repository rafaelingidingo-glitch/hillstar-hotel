"use client";

import { useContent, navigate } from "@/lib/site-hooks";
import { MapPin, Phone, Mail, Star, ArrowRight } from "lucide-react";

export function SiteFooter({
  content,
  loading,
}: {
  content: ReturnType<typeof useContent>["data"];
  loading: boolean;
}) {
  const hotel = content?.settings.hotel;

  return (
    <footer className="mt-auto bg-navy-950 text-ivory" aria-label="Footer">
      <div className="border-t border-gold-500/20" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center border border-gold-500/70 rotate-45">
                <svg viewBox="0 0 24 24" className="h-4 w-4 -rotate-45 fill-gold-500" aria-hidden="true">
                  <path d="M12 1l2.6 6.6L22 9.2l-5.4 4.6L18.5 21 12 17.3 5.5 21l1.9-7.2L2 9.2l7.4-1.6L12 1z" />
                </svg>
              </span>
              <span className="leading-none">
                <span className="block font-display text-lg tracking-[0.22em]">HILLSTAR</span>
                <span className="mt-1 block text-[9px] tracking-brand text-gold-400 uppercase">
                  Hotel · Dar es Salaam
                </span>
              </span>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-ivory/70">
              {loading
                ? "Comfort & hospitality in the heart of Dar es Salaam."
                : content?.settings.footer.note}
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-brand text-gold-400">Explore</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { label: "Rooms & Suites", path: "/rooms" },
                { label: "Restaurant & Dining", path: "/restaurant" },
                { label: "Meetings & Events", path: "/meetings" },
                { label: "Gallery", path: "/gallery" },
                { label: "About Hillstar", path: "/about" },
              ].map((l) => (
                <li key={l.path}>
                  <button
                    onClick={() => navigate(l.path)}
                    className="text-ivory/70 hover:text-gold-300 transition-colors"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-brand text-gold-400">Contact</h3>
            <ul className="mt-4 space-y-3 text-sm text-ivory/70">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
                <span>{hotel?.address ?? "Togo Street, Dar es Salaam, Tanzania"}</span>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
                <a href={`tel:${(hotel?.whatsapp ?? "").replace(/\s/g, "")}`} className="hover:text-gold-300 transition-colors">
                  {hotel?.whatsappDisplay ?? "+255 725 221 069"}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
                <a href={`mailto:${hotel?.email ?? ""}`} className="break-all hover:text-gold-300 transition-colors">
                  {hotel?.email ?? "reservations@hillstarhotel.co.tz"}
                </a>
              </li>
            </ul>
          </div>

          {/* Reserve */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-brand text-gold-400">Reserve</h3>
            <p className="mt-4 text-sm text-ivory/70 leading-relaxed">
              Rooms are in demand year-round. Secure your dates with a request today.
            </p>
            <button
              onClick={() => navigate("/booking")}
              className="mt-5 inline-flex items-center gap-2 bg-gold-500 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-navy-950 hover:bg-gold-400 transition-colors"
            >
              Book Your Stay
              <ArrowRight className="h-4 w-4" />
            </button>
            <div className="mt-6 flex items-center gap-2 text-xs text-ivory/50">
              <Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />
              <span>Independent hospitality, done properly.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-ivory/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:flex-row items-center justify-between sm:px-6 lg:px-8">
          <p className="text-xs text-ivory/50">
            © {new Date().getFullYear()} Hillstar Hotel, Dar es Salaam. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs">
            <button onClick={() => navigate("/privacy")} className="text-ivory/50 hover:text-gold-300 transition-colors">
              Privacy Policy
            </button>
            <button onClick={() => navigate("/terms")} className="text-ivory/50 hover:text-gold-300 transition-colors">
              Terms & Conditions
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
