import type { Metadata, Viewport } from "next";
import { Playfair_Display, Manrope } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://hillstarhotel.co.tz"),
  title: {
    default: "Hillstar Hotel — Comfort & Hospitality in Dar es Salaam",
    template: "%s | Hillstar Hotel",
  },
  description:
    "Hillstar Hotel on Togo Street, Dar es Salaam — comfortable accommodation, restaurant and dining, and professional meeting facilities. Book your stay today.",
  keywords: [
    "Hillstar Hotel",
    "Dar es Salaam hotel",
    "hotel accommodation Tanzania",
    "Togo Street hotel",
    "Dar es Salaam meeting rooms",
    "hotel restaurant Dar es Salaam",
  ],
  authors: [{ name: "Hillstar Hotel" }],
  openGraph: {
    title: "Hillstar Hotel — Comfort & Hospitality in Dar es Salaam",
    description:
      "Experience welcoming hospitality, comfortable accommodation, and convenient services in the heart of Dar es Salaam.",
    url: "/",
    siteName: "Hillstar Hotel",
    images: [{ url: "/images/hero-exterior.jpg", width: 1344, height: 768, alt: "Hillstar Hotel at dusk" }],
    locale: "en_TZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hillstar Hotel — Dar es Salaam",
    description:
      "Comfortable accommodation, restaurant and meeting facilities on Togo Street, Dar es Salaam.",
    images: ["/images/hero-exterior.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b1d33",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${manrope.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
