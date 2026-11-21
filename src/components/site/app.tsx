"use client";

import { useMemo, useSyncExternalStore } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useHashRoute, useContent, usePageMeta } from "@/lib/site-hooks";
import { NavBar } from "./nav-bar";
import { SiteFooter } from "./site-footer";
import { HomePage } from "./pages/home-page";
import { RoomsPage } from "./pages/rooms-page";
import { RoomDetailPage } from "./pages/room-detail-page";
import { RestaurantPage } from "./pages/restaurant-page";
import { MeetingsPage } from "./pages/meetings-page";
import { GalleryPage } from "./pages/gallery-page";
import { AboutPage } from "./pages/about-page";
import { ContactPage } from "./pages/contact-page";
import { BookingPage } from "./pages/booking-page";
import { BookingRequestPage } from "./pages/booking-request-page";
import { PrivacyPage } from "./pages/privacy-page";
import { TermsPage } from "./pages/terms-page";
import { AdminApp } from "@/components/admin/admin-app";

function JsonLd() {
  const data = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Hotel",
      name: "Hillstar Hotel",
      description:
        "Comfortable accommodation, restaurant and dining, and professional meeting facilities on Togo Street, Dar es Salaam.",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Togo Street",
        addressLocality: "Dar es Salaam",
        addressCountry: "TZ",
      },
      telephone: "+255725221069",
      amenityFeature: [
        { "@type": "AmenityFeature", name: "Free Wi-Fi" },
        { "@type": "AmenityFeature", name: "Restaurant" },
        { "@type": "AmenityFeature", name: "Meeting Facilities" },
        { "@type": "AmenityFeature", name: "24-hour Reception" },
      ],
      checkinTime: "14:00",
      checkoutTime: "10:00",
    }),
    []
  );
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  // One stable QueryClient per app lifetime
  const [client] = useMemo(
    () => [
      new QueryClient({
        defaultOptions: {
          queries: { refetchOnWindowFocus: false, retry: 1 },
        },
      }),
    ],
    []
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function SiteLoading({ full }: { full?: boolean }) {
  return (
    <div className={`flex items-center justify-center ${full ? "min-h-screen" : "min-h-[80vh]"}`}>
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-gold-500/30 border-t-gold-500 animate-spin" />
        <p className="text-xs uppercase tracking-brand text-muted-foreground">Hillstar Hotel</p>
      </div>
    </div>
  );
}

// Stable no-op subscription for the hydration gate below.
function subscribeNoop(_onStoreChange: () => void) {
  return () => {};
}

export function App() {
  const route = useHashRoute();
  const { data: content, isLoading } = useContent();

  const isAdmin = route.path === "/admin" || route.path.startsWith("/admin/");

  // The hash route is only known on the client. The first render (server and
  // hydration pass) therefore always shows the same stable loading shell —
  // this prevents hydration mismatches when the page is opened directly on a
  // deep link such as /#/admin or /#/rooms.
  // useSyncExternalStore returns false during SSR + the hydration render and
  // true afterwards, without a cascading setState inside an effect.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );

  usePageMeta(
    isAdmin ? "Admin" : "",
    isAdmin
      ? "Hillstar Hotel management dashboard"
      : "Experience welcoming hospitality, comfortable accommodation, and convenient services in the heart of Dar es Salaam.",
    isAdmin ? undefined : "/images/hero-exterior.jpg"
  );

  const page = useMemo(() => {
    if (isLoading) return <SiteLoading full />;
    if (!content) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-sm px-6">
            <p className="font-display text-2xl text-navy-900 mb-2">We&rsquo;re preparing the lobby</p>
            <p className="text-sm text-muted-foreground mb-6">
              The website content could not be loaded. Please refresh the page in a moment.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-none bg-navy-900 text-ivory px-6 py-2.5 text-sm tracking-wide hover:bg-navy-800 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }
    const p = route.path;
    const slug = p.startsWith("/rooms/") ? decodeURIComponent(p.slice("/rooms/".length)) : "";
    if (p === "/" || p === "") return <HomePage content={content} params={route.params} />;
    if (p === "/rooms")
      return <RoomsPage key={route.raw} content={content} params={route.params} />;
    if (p.startsWith("/rooms/")) return <RoomDetailPage key={slug} content={content} slug={slug} />;
    if (p === "/restaurant") return <RestaurantPage content={content} />;
    if (p === "/meetings") return <MeetingsPage content={content} />;
    if (p === "/gallery") return <GalleryPage content={content} />;
    if (p === "/about") return <AboutPage content={content} />;
    if (p === "/contact") return <ContactPage content={content} />;
    if (p === "/booking") return <BookingPage key={route.raw} content={content} params={route.params} />;
    if (p === "/booking/request") return <BookingRequestPage key={route.raw} content={content} params={route.params} />;
    if (p === "/privacy") return <PrivacyPage content={content} />;
    if (p === "/terms") return <TermsPage content={content} />;
    return <HomePage content={content} params={route.params} />;
  }, [content, isLoading, route.path, route.params, route.raw]);

  // Stable shell until after hydration — SSR output always matches the first
  // client render regardless of which hash route was requested.
  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteLoading full />
      </div>
    );
  }

  if (isAdmin) {
    return <AdminApp route={route} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <JsonLd />
      <NavBar activePath={route.path} />
      <main className="flex-1">{page}</main>
      <SiteFooter content={content} loading={isLoading} />
    </div>
  );
}
