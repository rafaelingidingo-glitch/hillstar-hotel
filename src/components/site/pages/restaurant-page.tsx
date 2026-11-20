"use client";

import { useMemo, useState } from "react";
import { type PublicContent, usePageMeta } from "@/lib/site-hooks";
import { PageHero } from "../ui-bits";
import { formatTZS, todayStr } from "@/lib/format";
import { apiSend } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, MessageCircle, UtensilsCrossed, CheckCircle2, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function RestaurantPage({ content }: { content: PublicContent }) {
  usePageMeta(
    "Restaurant & Dining",
    "Dining at Hillstar Hotel — breakfast, lunch and dinner with East African favourites and continental classics in Dar es Salaam.",
    "/images/restaurant-interior.jpg"
  );

  const { toast } = useToast();
  const [activeCat, setActiveCat] = useState<string>("all");
  const [reserving, setReserving] = useState(false);
  const [reservationDone, setReservationDone] = useState<{ whatsappUrl: string } | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    date: todayStr(),
    time: "19:00",
    partySize: 2,
    note: "",
  });

  const featured = useMemo(
    () => content.menu.flatMap((c) => c.items).filter((i) => i.featured).slice(0, 3),
    [content.menu]
  );

  const shownMenu = useMemo(
    () => (activeCat === "all" ? content.menu : content.menu.filter((c) => c.id === activeCat)),
    [content.menu, activeCat]
  );

  const submitReservation = async () => {
    setReserving(true);
    try {
      const res = await apiSend<{ whatsappUrl: string }>("/api/public/table-reservations", "POST", {
        name: form.name,
        phone: form.phone,
        email: form.email,
        date: form.date,
        time: form.time,
        partySize: form.partySize,
        note: form.note,
      });
      setReservationDone(res);
      toast({ title: "Table request received", description: "Finish by sending the prepared WhatsApp message." });
    } catch (e) {
      toast({
        title: "Could not submit",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setReserving(false);
    }
  };

  return (
    <div>
      <PageHero
        image="/images/hero-dining.jpg"
        eyebrow="Restaurant & Dining"
        title={content.settings.restaurant.title}
        intro={content.settings.restaurant.intro}
      />

      {/* Hours strip */}
      <div className="border-b border-border bg-navy-950">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-2 px-4 py-4">
          {content.settings.restaurant.hours.map((h) => (
            <div key={h.label} className="flex items-center gap-2 text-sm">
              <Clock className="h-3.5 w-3.5 text-gold-500" />
              <span className="text-ivory/70">{h.label}</span>
              <span className="font-medium text-gold-400">{h.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Signature dishes */}
      {featured.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-brand text-gold-600">Chef&rsquo;s selection</p>
            <h2 className="mt-3 font-display text-3xl text-navy-900">Signature dishes</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {featured.map((d) => (
                <article key={d.id} className="group border border-border/70 bg-card overflow-hidden">
                  <div className="aspect-[4/3] overflow-hidden bg-sand">
                    {d.image ? (
                       
                      <img
                        src={d.image}
                        alt={d.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <UtensilsCrossed className="h-8 w-8 text-gold-600" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-display text-lg text-navy-900">{d.name}</h3>
                      <span className="shrink-0 font-semibold text-gold-700">{formatTZS(d.price)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Menu */}
      <section className="bg-ivory py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-3xl text-navy-900">Our menu</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCat("all")}
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  activeCat === "all" ? "bg-navy-900 text-ivory" : "border border-border bg-card text-muted-foreground hover:text-navy-900"
                }`}
              >
                All
              </button>
              {content.menu.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                    activeCat === c.id ? "bg-navy-900 text-ivory" : "border border-border bg-card text-muted-foreground hover:text-navy-900"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10 space-y-12">
            {shownMenu.map((cat) => (
              <div key={cat.id}>
                <div className="flex items-baseline gap-4">
                  <h3 className="font-display text-2xl text-navy-900">{cat.name}</h3>
                  <div className="h-px flex-1 bg-border" />
                </div>
                {cat.description && <p className="mt-2 text-sm text-muted-foreground">{cat.description}</p>}
                <div className="mt-6 grid gap-x-10 gap-y-6 md:grid-cols-2">
                  {cat.items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      {item.image && (
                        <div className="h-16 w-16 shrink-0 overflow-hidden bg-sand">
                          { }
                          <img src={item.image} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="font-medium text-navy-900">{item.name}</p>
                          <div className="mx-2 hidden flex-1 border-b border-dotted border-border sm:block" />
                          <span className="shrink-0 font-semibold text-gold-700">{formatTZS(item.price)}</span>
                        </div>
                        {item.description && (
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {cat.items.length === 0 && (
                  <p className="mt-4 text-sm text-muted-foreground">Menu items for this category are being updated.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Table reservation */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-5 lg:gap-16">
            <div className="lg:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-brand text-gold-600">Reserve a table</p>
              <h2 className="mt-3 font-display text-3xl text-navy-900">Join us for a meal</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                {content.settings.restaurant.reservationNote} Submit a request and complete it over WhatsApp —
                or simply walk in; we keep tables available daily.
              </p>
              <div className="mt-6 space-y-2.5 text-sm text-muted-foreground">
                <p className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
                  Table reservations are handled separately from room bookings.
                </p>
                <p className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
                  Larger groups and private dining can be arranged on request.
                </p>
              </div>
            </div>

            <div className="lg:col-span-3 border border-border bg-card p-6 md:p-8">
              {reservationDone ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-gold-600" strokeWidth={1.25} />
                  <h3 className="mt-4 font-display text-2xl text-navy-900">Almost done!</h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                    Your table request has been received by our team. Please press the button below and{" "}
                    <strong className="text-navy-900">press SEND</strong> in WhatsApp so we receive your message
                    and can confirm your table.
                  </p>
                  <Button asChild className="mt-6 bg-gold-500 text-navy-950 hover:bg-gold-400">
                    <a href={reservationDone.whatsappUrl} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4" />
                      Open WhatsApp & Press Send
                    </a>
                  </Button>
                  <button
                    onClick={() => {
                      setReservationDone(null);
                      setForm({ name: "", phone: "", email: "", date: todayStr(), time: "19:00", partySize: 2, note: "" });
                    }}
                    className="mt-4 block w-full text-xs uppercase tracking-wider text-muted-foreground hover:text-navy-900"
                  >
                    Make another request
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitReservation();
                  }}
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <div className="sm:col-span-2">
                    <Label htmlFor="tr-name">Full name *</Label>
                    <Input
                      id="tr-name"
                      required
                      minLength={2}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your name"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tr-phone">Phone (WhatsApp) *</Label>
                    <Input
                      id="tr-phone"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+255 7xx xxx xxx"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tr-email">Email (optional)</Label>
                    <Input
                      id="tr-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tr-date">Date *</Label>
                    <Input
                      id="tr-date"
                      type="date"
                      required
                      min={todayStr()}
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tr-time">Time *</Label>
                    <Input
                      id="tr-time"
                      type="time"
                      required
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tr-party">Guests *</Label>
                    <Input
                      id="tr-party"
                      type="number"
                      required
                      min={1}
                      max={30}
                      value={form.partySize}
                      onChange={(e) => setForm({ ...form, partySize: Number(e.target.value) })}
                      className="mt-1.5"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="tr-note">Special requests</Label>
                    <Textarea
                      id="tr-note"
                      rows={3}
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      placeholder="Birthday, quiet corner, dietary needs..."
                      className="mt-1.5"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button
                      type="submit"
                      disabled={reserving}
                      className="w-full bg-navy-900 text-ivory hover:bg-navy-800"
                    >
                      {reserving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" /> Request Table
                        </>
                      )}
                    </Button>
                    <p className="mt-3 text-center text-[11px] text-muted-foreground">
                      After submitting, you&rsquo;ll be redirected to WhatsApp — remember to press SEND.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
