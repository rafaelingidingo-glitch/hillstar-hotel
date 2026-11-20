"use client";

import { type PublicContent, usePageMeta } from "@/lib/site-hooks";

export function PrivacyPage({ content }: { content: PublicContent }) {
  usePageMeta(
    "Privacy Policy",
    "Privacy Policy for Hillstar Hotel, Dar es Salaam — how we collect, use and protect your personal information.",
    undefined
  );
  const hotel = content.settings.hotel;

  const sections: { title: string; body: string[] }[] = [
    {
      title: "1. Information We Collect",
      body: [
        "When you submit a booking request, table reservation, or event inquiry through this website, we collect the information you provide directly: your name, phone number, email address (if provided), dates and details of your requested stay or event, and any special requests you choose to share.",
        "Our website does not use advertising trackers. Basic technical data (such as IP address) may be processed temporarily to protect the website against abuse.",
      ],
    },
    {
      title: "2. How We Use Your Information",
      body: [
        "We use your information solely to process and respond to your requests: checking availability, preparing quotations, confirming reservations, and communicating with you about your stay or event.",
        "WhatsApp communication happens directly between you and the hotel through WhatsApp; please refer to WhatsApp's own privacy policy for details of how your messages are handled on their platform.",
      ],
    },
    {
      title: "3. Sharing Your Information",
      body: [
        "We do not sell or rent your personal information. Your details are accessible only to authorised Hillstar Hotel staff who need them to serve your request.",
      ],
    },
    {
      title: "4. Data Retention",
      body: [
        "Booking records and inquiries are retained for operational and accounting purposes. You may request deletion of personal data that we are not legally required to keep by contacting us.",
      ],
    },
    {
      title: "5. Your Rights",
      body: [
        `You may contact us at any time to request access to, correction of, or deletion of your personal information. Reach us at ${hotel.whatsappDisplay} or ${hotel.email}.`,
      ],
    },
    {
      title: "6. Security",
      body: [
        "We apply reasonable technical and organisational measures to protect personal information submitted through this website, including access controls on the hotel's management dashboard.",
      ],
    },
    {
      title: "7. Changes to This Policy",
      body: ["We may update this policy from time to time. The version published on this page is the current one."],
    },
  ];

  return (
    <div className="bg-ivory">
      <section className="bg-navy-950 pt-28 pb-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-brand text-gold-400">Legal</p>
          <h1 className="mt-3 font-display text-4xl text-ivory">Privacy Policy</h1>
          <p className="mt-3 text-sm text-ivory/60">Hillstar Hotel — {hotel.address}</p>
        </div>
      </section>
      <section className="py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="space-y-10">
            {sections.map((s) => (
              <div key={s.title}>
                <h2 className="font-display text-xl text-navy-900">{s.title}</h2>
                {s.body.map((p, i) => (
                  <p key={i} className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                    {p}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
