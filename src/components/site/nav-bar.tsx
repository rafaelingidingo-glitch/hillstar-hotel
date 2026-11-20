"use client";

import { useEffect, useState } from "react";
import { useScrolled, navigate, useContent } from "@/lib/site-hooks";
import { Menu, X, Phone } from "lucide-react";

const NAV_LINKS: { label: string; path: string }[] = [
  { label: "Home", path: "/" },
  { label: "Rooms & Suites", path: "/rooms" },
  { label: "Restaurant", path: "/restaurant" },
  { label: "Meetings & Events", path: "/meetings" },
  { label: "Gallery", path: "/gallery" },
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
];

function isActive(path: string, activePath: string): boolean {
  if (path === "/") return activePath === "/" || activePath === "";
  if (path === "/rooms") return activePath === "/rooms" || activePath.startsWith("/rooms/");
  return activePath === path;
}

export function NavBar({ activePath }: { activePath: string }) {
  // Start "solid" so server and client first paints match; the effect corrects it.
  const scrolled = useScrolled(48, true);
  const [open, setOpen] = useState(false);
  const { data: content } = useContent();
  const phone = content?.settings.hotel.whatsappDisplay ?? "+255 725 221 069";

  // Lock body scroll when the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const solid = scrolled || activePath !== "/" || open;

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          solid
            ? "bg-navy-950/95 backdrop-blur-md shadow-[0_1px_0_rgba(198,161,91,0.25)]"
            : "bg-gradient-to-b from-navy-950/80 via-navy-950/35 to-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 md:h-[72px] items-center justify-between">
            {/* Wordmark */}
            <button
              onClick={() => go("/")}
              className="flex items-center gap-3 group text-left"
              aria-label="Hillstar Hotel — Home"
            >
              <span className="flex h-9 w-9 items-center justify-center border border-gold-500/70 rotate-45 group-hover:border-gold-400 transition-colors">
                <svg viewBox="0 0 24 24" className="h-4 w-4 -rotate-45 fill-gold-500" aria-hidden="true">
                  <path d="M12 1l2.6 6.6L22 9.2l-5.4 4.6L18.5 21 12 17.3 5.5 21l1.9-7.2L2 9.2l7.4-1.6L12 1z" />
                </svg>
              </span>
              <span className="leading-none">
                <span className="block font-display text-lg md:text-xl tracking-[0.22em] text-ivory">
                  HILLSTAR
                </span>
                <span className="mt-1 block text-[9px] md:text-[10px] tracking-brand text-gold-400 uppercase">
                  Hotel · Dar es Salaam
                </span>
              </span>
            </button>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-7" aria-label="Primary">
              {NAV_LINKS.map((l) => (
                <button
                  key={l.path}
                  onClick={() => go(l.path)}
                  className={`text-[13px] tracking-wide transition-colors duration-200 pb-1 border-b ${
                    isActive(l.path, activePath)
                      ? "text-gold-400 border-gold-500"
                      : "text-ivory/85 border-transparent hover:text-gold-300"
                  }`}
                >
                  {l.label}
                </button>
              ))}
              <button
                onClick={() => go("/booking")}
                className="ml-2 bg-gold-500 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wider text-navy-950 hover:bg-gold-400 transition-colors"
              >
                Book a Room
              </button>
            </nav>

            {/* Mobile controls */}
            <div className="flex items-center gap-2 lg:hidden">
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="flex h-10 w-10 items-center justify-center border border-ivory/25 text-ivory/90"
                aria-label={`Call ${phone}`}
              >
                <Phone className="h-4 w-4" />
              </a>
              <button
                onClick={() => setOpen(!open)}
                className="flex h-10 w-10 items-center justify-center border border-ivory/25 text-ivory"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-navy-950/97 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <nav
          className="relative flex h-full flex-col justify-center px-8 pt-20"
          aria-label="Mobile"
        >
          <ul className="space-y-1">
            {NAV_LINKS.map((l, i) => (
              <li key={l.path}>
                <button
                  onClick={() => go(l.path)}
                  style={{ transitionDelay: `${open ? i * 40 + 80 : 0}ms` }}
                  className={`w-full py-3.5 text-left font-display text-2xl text-ivory transition-all duration-300 border-b border-ivory/10 ${
                    open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                  } ${isActive(l.path, activePath) ? "text-gold-400" : ""}`}
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={() => go("/booking")}
            className={`mt-8 bg-gold-500 px-6 py-4 text-sm font-semibold uppercase tracking-wider text-navy-950 transition-all duration-300 ${
              open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
            style={{ transitionDelay: `${open ? 380 : 0}ms` }}
          >
            Book Your Stay
          </button>
          <p
            className={`mt-8 text-sm text-ivory/60 transition-all duration-300 ${
              open ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: `${open ? 460 : 0}ms` }}
          >
            Togo Street, Dar es Salaam · {phone}
          </p>
        </nav>
      </div>
    </>
  );
}
