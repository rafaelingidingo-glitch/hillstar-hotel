"use client";

import { type PublicContent, usePageMeta } from "@/lib/site-hooks";

export function TermsPage({ content }: { content: PublicContent }) {
  usePageMeta(
    "Terms & Conditions",
    "Terms & Conditions for bookings and services at Hillstar Hotel, Dar es Salaam.",
    undefined
  );
  const b = content.settings.booking;
  const hotel = content.settings.hotel;

  const sections: { title: string; body: string[] }[] = [
    {
      title: "1. Booking Requests",
      body: [
        b.requestNote,
        "A booking request submitted through this website is not a confirmed reservation until our team confirms it. Requests that are not confirmed within the pending window may expire and release the held room.",
      ],
    },
    {
      title: "2. Confirmation & Payment",
      body: [
        "Our reservations team will contact you (typically via WhatsApp or phone) to confirm your booking. Payment terms are communicated at confirmation; no online payment is collected through this website.",
        "Estimated totals shown on the website are indicative and are calculated from the nightly rate for the selected room category.",
      ],
    },
    {
      title: "3. Check-in & Check-out",
      body: [
        `Check-in is available from ${b.checkInTime} on the arrival date, and check-out is by ${b.checkOutTime} on the departure date. Early check-in and late check-out are subject to availability and may incur additional charges.`,
        "Please present valid identification at check-in.",
      ],
    },
    {
      title: "4. Children",
      body: [b.childrenPolicy, "Children must be accompanied by a parent or guardian at all times."],
    },
    {
      title: "5. Cancellations & No-Shows",
      body: [
        b.cancellationNote,
        "Guests who do not arrive on the arrival date without prior communication may have their reservation marked as a no-show and the room released.",
      ],
    },
    {
      title: "6. Restaurant Reservations",
      body: [
        "Table reservations are handled separately from room bookings and are confirmed on a best-effort basis. Please inform us of any changes to your party size.",
      ],
    },
    {
      title: "7. Meetings & Events",
      body: [
        "Event inquiries receive a tailored quotation. Event dates are held only once the quotation is confirmed and the agreed arrangements are made with our events team.",
      ],
    },
    {
      title: "8. Conduct & Safety",
      body: [
        "Guests are asked to respect other visitors and hotel property. The hotel reserves the right to end a stay, without refund, in cases of serious misconduct or safety violations.",
      ],
    },
    {
      title: "9. Liability",
      body: [
        "Personal belongings are brought at the owner's risk. Please use the room safe or reception storage for valuables where available. Our liability is limited to the extent permitted by the laws of the United Republic of Tanzania.",
      ],
    },
    {
      title: "10. Contact",
      body: [`For any questions about these terms, contact us at ${hotel.whatsappDisplay} or ${hotel.email}.`],
    },
  ];

  return (
    <div className="bg-ivory">
      <section className="bg-navy-950 pt-28 pb-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-brand text-gold-400">Legal</p>
          <h1 className="mt-3 font-display text-4xl text-ivory">Terms &amp; Conditions</h1>
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
