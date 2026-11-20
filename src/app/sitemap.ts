import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://hillstarhotel.co.tz";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/rooms",
    "/restaurant",
    "/meetings",
    "/gallery",
    "/about",
    "/contact",
    "/booking",
    "/privacy",
    "/terms",
  ];
  return routes.map((r) => ({
    url: `${SITE_URL}/${r ? "#" + r : ""}`,
    lastModified: new Date(),
    changeFrequency: r === "" ? ("weekly" as const) : ("monthly" as const),
    priority: r === "" ? 1 : 0.7,
  }));
}
