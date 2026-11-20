"use client";

import { useMemo, useState } from "react";
import { type PublicContent, usePageMeta } from "@/lib/site-hooks";
import { PageHero } from "../ui-bits";
import { formatTZS, todayStr } from "@/lib/format";
import { apiSend } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  MessageCircle,
  CheckCircle2,
  Presentation,
  UserRound,
  Users,
  MonitorPlay,
  Send,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EVENT_TYPES = ["Conference", "Seminar / Training", "Board Meeting", "Workshop", "Corporate Event", "Product Presentation", "Other"];

export function MeetingsPage({ content }: { content: PublicContent }) {
  usePageMeta(
    "Meetings & Events",
    "Professional meeting rooms and event facilities at Hillstar Hotel, Dar es Salaam — conference room and executive boardroom with full equipment.",
    "/images/meeting-room.jpg"
  );

  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ reference: string; whatsappUrl: string } | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string>("");

  const [form, setForm] = useState({
    organization: "",
    contactPerson: "",
    email: "",
    phone: "",
    eventType: "Conference",
    attendees: 10,
    preferredDate: "",
    duration: "Half day",
    requirements: "",
  });

  const rooms = content.meetingRooms;
  const selectedRoomObj = useMemo(() => rooms.find((r) => r.id === selectedRoom), [rooms, selectedRoom]);

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await apiSend<{ reference: string; whatsappUrl: string }>("/api/public/meeting-inquiries", "POST", {
        ...form,
        roomId: selectedRoom || null,
      });
      setDone(res);
      toast({ title: "Inquiry received", description: `Reference ${res.reference}. Complete via WhatsApp.` });
    } catch (e) {
      toast({
        title: "Could not submit",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHero
        image="/images/meeting-room.jpg"
        eyebrow="Meetings & Events"
        title={content.settings.meetings.title}
        intro={content.settings.meetings.intro}
      />

      {/* Spaces */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {rooms.map((m, idx) => (
              <article
                key={m.id}
                className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-14 ${idx % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}
              >
                <div className="relative overflow-hidden">
                  <div className="aspect-[16/10] bg-sand">
                    {m.image ? (
                       
                      <img src={m.image} alt={m.name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Presentation className="h-10 w-10 text-gold-600" />
                      </div>
                    )}
                  </div>
                  <div className="absolute top-4 left-4 bg-navy-950/90 px-4 py-2">
                    <p className="text-xs text-ivory/70">
                      Capacity <span className="ml-1 font-semibold text-gold-400">{m.capacity} guests</span>
                    </p>
                  </div>
                </div>
                <div>
                  <h2 className="font-display text-2xl md:text-3xl text-navy-900">{m.name}</h2>
                  <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{m.description}</p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="border border-border/70 bg-card p-4">
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold-700">
                        <Users className="h-3.5 w-3.5" /> Seating arrangements
                      </p>
                      <ul className="mt-3 space-y-1.5">
                        {m.seating.map((s) => (
                          <li key={s.name} className="flex justify-between text-sm">
                            <span className="text-foreground/80">{s.name}</span>
                            <span className="text-muted-foreground">{s.capacity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="border border-border/70 bg-card p-4">
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold-700">
                        <MonitorPlay className="h-3.5 w-3.5" /> Equipment
                      </p>
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {m.equipment.map((e) => (
                          <li key={e} className="bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                            {e}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
                    <div className="text-sm">
                      {m.hourlyRate ? (
                        <>
                          <span className="font-semibold text-navy-900">{formatTZS(m.hourlyRate)}</span>
                          <span className="text-muted-foreground"> / hour · {m.pricingNote}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">{m.pricingNote}</span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedRoom(m.id);
                        document.getElementById("meeting-inquiry")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="inline-flex items-center gap-2 bg-navy-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory hover:bg-navy-800 transition-colors"
                    >
                      Enquire About This Room
                      <UserRound className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {rooms.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Meeting spaces will appear here once configured by the hotel.
            </p>
          )}
        </div>
      </section>

      {/* Inquiry form */}
      <section id="meeting-inquiry" className="bg-ivory py-16 md:py-24 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-5 lg:gap-16">
            <div className="lg:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-brand text-gold-600">Event inquiry</p>
              <h2 className="mt-3 font-display text-3xl text-navy-900">Tell us about your event</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                {content.settings.meetings.note} Submit the form and our events team will respond with a tailored
                quotation.
              </p>
              <div className="mt-8 space-y-3 border-t border-border pt-8 text-sm">
                <p className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
                  Response within one business day.
                </p>
                <p className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
                  Catering and tea-break packages available.
                </p>
                <p className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
                  Accommodation packages for multi-day events.
                </p>
              </div>
            </div>

            <div className="lg:col-span-3 border border-border bg-card p-6 md:p-8">
              {done ? (
                <div className="py-6 text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-gold-600" strokeWidth={1.25} />
                  <h3 className="mt-4 font-display text-2xl text-navy-900">Inquiry received</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your reference: <span className="font-semibold text-navy-900">{done.reference}</span>
                  </p>
                  <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                    Our events team will contact you shortly. To speed things up, press the button below and{" "}
                    <strong className="text-navy-900">press SEND</strong> in WhatsApp to notify our team directly.
                  </p>
                  <Button asChild className="mt-6 bg-gold-500 text-navy-950 hover:bg-gold-400">
                    <a href={done.whatsappUrl} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4" />
                      Notify via WhatsApp
                    </a>
                  </Button>
                  <button
                    onClick={() => {
                      setDone(null);
                      setForm({ ...form, organization: "", contactPerson: "", email: "", phone: "", requirements: "" });
                    }}
                    className="mt-4 block w-full text-xs uppercase tracking-wider text-muted-foreground hover:text-navy-900"
                  >
                    Submit another inquiry
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
                    <Label htmlFor="mi-org">Organization name *</Label>
                    <Input
                      id="mi-org"
                      required
                      minLength={2}
                      value={form.organization}
                      onChange={(e) => setForm({ ...form, organization: e.target.value })}
                      className="mt-1.5"
                      placeholder="Company or organization"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mi-contact">Contact person *</Label>
                    <Input
                      id="mi-contact"
                      required
                      minLength={2}
                      value={form.contactPerson}
                      onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mi-phone">Phone number *</Label>
                    <Input
                      id="mi-phone"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="mt-1.5"
                      placeholder="+255 7xx xxx xxx"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="mi-email">Email *</Label>
                    <Input
                      id="mi-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Event type *</Label>
                    <Select
                      value={form.eventType}
                      onValueChange={(v) => setForm({ ...form, eventType: v })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="mi-attendees">Expected attendees *</Label>
                    <Input
                      id="mi-attendees"
                      type="number"
                      required
                      min={1}
                      max={1000}
                      value={form.attendees}
                      onChange={(e) => setForm({ ...form, attendees: Number(e.target.value) })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mi-date">Preferred date</Label>
                    <Input
                      id="mi-date"
                      type="date"
                      min={todayStr()}
                      value={form.preferredDate}
                      onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Duration</Label>
                    <Select value={form.duration} onValueChange={(v) => setForm({ ...form, duration: v })}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Half day", "Full day", "Two days", "Evening", "Multi-day event", "Other"].map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {rooms.length > 0 && (
                    <div className="sm:col-span-2">
                      <Label>Preferred space</Label>
                      <Select
                        value={selectedRoom || "any"}
                        onValueChange={(v) => setSelectedRoom(v === "any" ? "" : v)}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">No preference / advise me</SelectItem>
                          {rooms.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.name} (up to {r.capacity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <Label htmlFor="mi-req">Additional requirements</Label>
                    <Textarea
                      id="mi-req"
                      rows={4}
                      value={form.requirements}
                      onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                      placeholder="Catering, equipment, layout, accommodation needs..."
                      className="mt-1.5"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-navy-900 text-ivory hover:bg-navy-800"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" /> Submit Inquiry
                        </>
                      )}
                    </Button>
                    <p className="mt-3 text-center text-[11px] text-muted-foreground">
                      Saved to our events desk — optionally notify us via WhatsApp afterwards.
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
