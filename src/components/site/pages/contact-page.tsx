"use client";

import { useState } from "react";
import { type PublicContent, usePageMeta } from "@/lib/site-hooks";
import { PageHero } from "../ui-bits";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  Send,
  CheckCircle2,
  Loader2,
  Navigation,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ContactPage({ content }: { content: PublicContent }) {
  usePageMeta(
    "Contact & Location",
    "Contact Hillstar Hotel — Togo Street, Dar es Salaam. Call or WhatsApp +255 725 221 069 for reservations and inquiries.",
    "/images/hero-exterior.jpg"
  );

  const { toast } = useToast();
  const hotel = content.settings.hotel;
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ whatsappUrl: string } | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });

  const submit = async () => {
    setSending(true);
    try {
      // General contact messages are delivered via a prefilled WhatsApp message.
      const whatsappUrl = `https://wa.me/${hotel.whatsapp}?text=${encodeURIComponent(
        `Hello Hillstar Hotel,\n\nName: ${form.name}\nPhone: ${form.phone}\n${form.email ? `Email: ${form.email}\n` : ""}\nMessage: ${form.message}`
      )}`;
      setDone({ whatsappUrl });
      toast({ title: "Ready to send", description: "Press SEND in WhatsApp to deliver your message." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHero
        image="/images/hero-exterior.jpg"
        eyebrow="Contact & Location"
        title="We're here to help"
        intro={`Find us on Togo Street, Dar es Salaam — call, WhatsApp or visit. Our reception is open 24 hours.`}
      />

      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-5 lg:gap-14">
            {/* Info column */}
            <div className="space-y-8 lg:col-span-2">
              <div className="border border-border bg-card p-6">
                <h2 className="font-display text-xl text-navy-900">Contact details</h2>
                <ul className="mt-5 space-y-4 text-sm">
                  <li className="flex gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
                    <div>
                      <p className="font-medium text-navy-900">Address</p>
                      <p className="mt-0.5 text-muted-foreground">{hotel.address}</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
                    <div>
                      <p className="font-medium text-navy-900">Phone / WhatsApp</p>
                      <a href={`tel:${hotel.whatsapp.replace(/\s/g, "")}`} className="mt-0.5 block text-muted-foreground hover:text-gold-700">
                        {hotel.whatsappDisplay}
                      </a>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
                    <div>
                      <p className="font-medium text-navy-900">Email</p>
                      <a href={`mailto:${hotel.email}`} className="mt-0.5 break-all text-muted-foreground hover:text-gold-700">
                        {hotel.email}
                      </a>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
                    <div>
                      <p className="font-medium text-navy-900">Reception</p>
                      <p className="mt-0.5 text-muted-foreground">Open 24 hours · Check-in {content.settings.booking.checkInTime} · Check-out {content.settings.booking.checkOutTime}</p>
                    </div>
                  </li>
                </ul>
                <div className="mt-6 flex flex-col gap-2.5">
                  <Button asChild className="bg-gold-500 text-navy-950 hover:bg-gold-400">
                    <a
                      href={`https://wa.me/${hotel.whatsapp}?text=${encodeURIComponent("Hello Hillstar Hotel, I have a question.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Chat on WhatsApp
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="border-navy-900/30">
                    <a href={hotel.mapUrl} target="_blank" rel="noopener noreferrer">
                      <Navigation className="mr-2 h-4 w-4" />
                      Open in Google Maps
                    </a>
                  </Button>
                </div>
              </div>

              <div className="border border-border bg-card overflow-hidden">
                <iframe
                  title="Map — Hillstar Hotel, Togo Street, Dar es Salaam"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent("Togo Street, Dar es Salaam, Tanzania")}&z=15&output=embed`}
                  className="h-72 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            {/* Message form */}
            <div className="lg:col-span-3">
              <div className="border border-border bg-card p-6 md:p-8">
                {done ? (
                  <div className="py-6 text-center">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-gold-600" strokeWidth={1.25} />
                    <h3 className="mt-4 font-display text-2xl text-navy-900">Your message is ready</h3>
                    <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                      Tap the button below to open WhatsApp with your message prefilled — please{" "}
                      <strong className="text-navy-900">press SEND</strong> so our team receives it. We typically
                      reply within minutes.
                    </p>
                    <Button asChild className="mt-6 bg-gold-500 text-navy-950 hover:bg-gold-400">
                      <a href={done.whatsappUrl} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Open WhatsApp & Press Send
                      </a>
                    </Button>
                    <button
                      onClick={() => {
                        setDone(null);
                        setForm({ name: "", phone: "", email: "", message: "" });
                      }}
                      className="mt-4 block w-full text-xs uppercase tracking-wider text-muted-foreground hover:text-navy-900"
                    >
                      Write another message
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      submit();
                    }}
                    className="grid gap-4 sm:grid-cols-2"
                  >
                    <div className="sm:col-span-2">
                      <h2 className="font-display text-xl text-navy-900">Send us a message</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        For room bookings, please use the{" "}
                        <button
                          type="button"
                          className="text-gold-700 underline underline-offset-2"
                          onClick={() => (window.location.hash = "#/booking")}
                        >
                          booking page
                        </button>{" "}
                        so we can check availability.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="ct-name">Name *</Label>
                      <Input id="ct-name" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="ct-phone">Phone *</Label>
                      <Input id="ct-phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5" placeholder="+255 7xx xxx xxx" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="ct-email">Email (optional)</Label>
                      <Input id="ct-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="ct-msg">Message *</Label>
                      <Textarea
                        id="ct-msg"
                        required
                        rows={6}
                        minLength={10}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        placeholder="How can we help?"
                        className="mt-1.5"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Button type="submit" disabled={sending} className="w-full bg-navy-900 text-ivory hover:bg-navy-800">
                        {sending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" /> Continue to WhatsApp
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
