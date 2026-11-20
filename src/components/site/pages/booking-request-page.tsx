"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { type PublicContent, usePageMeta, navigate } from "@/lib/site-hooks";
import { apiSend } from "@/lib/api-client";
import { formatTZS, formatDateMedium, nightsBetweenStrs, todayStr, addDaysStr } from "@/lib/format";
import { Loader2, MessageCircle, CircleAlert, Timer, UserRound, Baby, Info, CheckCircle2, ChevronLeft, Phone } from "lucide-react";
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

interface FreeRoomsResponse {
  rooms: { roomId: string; number: string; floor: string; free: boolean }[];
}

interface CreateResponse {
  booking: {
    id: string;
    reference: string;
    status: string;
    categoryName: string;
    roomNumber: string | null;
    checkIn: string;
    checkOut: string;
    nights: number;
    adults: number;
    children: number;
    estimatedTotal: number;
    expiresAt: string | null;
  };
  whatsappUrl: string;
  expiresInMinutes: number;
}

function useCountdown(expiresAt: string | null | undefined) {
  const [, tick] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    if (!expiresAt) return;
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt, tick]);
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "0:00";
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function BookingRequestPage({
  content,
  params,
}: {
  content: PublicContent;
  params: Record<string, string>;
}) {
  usePageMeta("Complete Your Request", "Finalise your booking request to Hillstar Hotel.", undefined);

  const today = todayStr();
  const validDates =
    /^\d{4}-\d{2}-\d{2}$/.test(params.checkIn || "") && /^\d{4}-\d{2}-\d{2}$/.test(params.checkOut || "");
  const category = useMemo(
    () => content.roomCategories.find((c) => c.id === params.categoryId),
    [content.roomCategories, params.categoryId]
  );

  const checkIn = validDates ? (params.checkIn as string) : today;
  const checkOut = validDates ? (params.checkOut as string) : addDaysStr(today, 2);
  const nights = useMemo(() => {
    try {
      const n = nightsBetweenStrs(checkIn, checkOut);
      return n > 0 ? n : 0;
    } catch {
      return 0;
    }
  }, [checkIn, checkOut]);

  const [form, setForm] = useState({
    guestName: "",
    guestPhone: "",
    guestEmail: "",
    adults: Math.max(1, Number(params.adults) || 2),
    children: Math.max(0, Number(params.children) || 0),
    specialRequests: "",
  });
  const [preferredRoom, setPreferredRoom] = useState<string>("any");
  const [freeRooms, setFreeRooms] = useState<{ roomId: string; number: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreateResponse | null>(null);
  const submittedRef = useRef(false);
  const countdown = useCountdown(created?.booking.expiresAt);

  // Redirect guards
  useEffect(() => {
    if (!category || nights <= 0 || checkIn < today) {
      navigate("/booking");
    }
  }, [category, nights, checkIn, today]);

  // Load free rooms for preferred-room selection
  useEffect(() => {
    if (!category) return;
    apiSend<FreeRoomsResponse>("/api/public/availability/rooms", "POST", { categoryId: category.id, checkIn, checkOut })
      .then((res) => setFreeRooms(res.rooms.filter((r) => r.free)))
      .catch(() => setFreeRooms([]));
  }, [category, checkIn, checkOut]);

  const capacityError = useMemo(() => {
    if (!category) return null;
    if (form.adults > category.maxAdults) return `This room type accommodates up to ${category.maxAdults} adults.`;
    if (form.children > category.maxChildren) return `This room type accommodates up to ${category.maxChildren} children.`;
    if (form.adults + form.children > category.maxTotalGuests)
      return `Total guests exceed this room type's maximum of ${category.maxTotalGuests}.`;
    return null;
  }, [category, form.adults, form.children]);

  const total = category ? category.pricePerNight * Math.max(nights, 0) : 0;
  const waNumber = content.settings.hotel.whatsapp;
  const waDisplay = content.settings.hotel.whatsappDisplay;

  const submit = async () => {
    if (!category || submittedRef.current || capacityError) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await apiSend<CreateResponse>("/api/public/bookings", "POST", {
        checkIn,
        checkOut,
        categoryId: category.id,
        preferredRoomId: preferredRoom === "any" ? null : preferredRoom,
        adults: form.adults,
        children: form.children,
        roomsWanted: 1,
        guestName: form.guestName,
        guestPhone: form.guestPhone,
        guestEmail: form.guestEmail,
        specialRequests: form.specialRequests,
      });
      submittedRef.current = true;
      setCreated(res);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Could not submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ------------------------------------------------------------- success view
  if (created) {
    return (
      <div className="bg-ivory pt-28 pb-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="border border-gold-500/40 bg-card p-8 md:p-10 text-center shadow-[0_18px_60px_rgba(11,29,51,0.1)]">
            <CheckCircle2 className="mx-auto h-14 w-14 text-gold-600" strokeWidth={1.25} />
            <h1 className="mt-5 font-display text-3xl text-navy-900">Request received</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your booking reference is{" "}
              <span className="font-semibold text-navy-900">{created.booking.reference}</span>
            </p>

            <div className="mx-auto mt-6 max-w-sm border border-border bg-ivory/60 p-5 text-left text-sm">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Room</span>
                <span className="font-medium text-navy-900">
                  {created.booking.categoryName}
                  {created.booking.roomNumber ? ` · Room ${created.booking.roomNumber}` : ""}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Dates</span>
                <span className="font-medium text-navy-900">
                  {formatDateMedium(created.booking.checkIn)} → {formatDateMedium(created.booking.checkOut)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Guests</span>
                <span className="font-medium text-navy-900">
                  {created.booking.adults} adult{created.booking.adults > 1 ? "s" : ""}
                  {created.booking.children > 0 ? `, ${created.booking.children} child` : ""}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 mt-2">
                <span className="text-muted-foreground">Estimated total</span>
                <span className="font-semibold text-navy-900">{formatTZS(created.booking.estimatedTotal)}</span>
              </div>
              {countdown && (
                <div className="mt-3 flex items-center justify-center gap-2 border-t border-border pt-3 text-xs text-gold-700">
                  <Timer className="h-3.5 w-3.5" />
                  Your room is held for <span className="font-bold tabular-nums">{countdown}</span> — send your
                  WhatsApp message to keep it.
                </div>
              )}
            </div>

            <div className="mt-7 border border-gold-500/40 bg-accent px-5 py-4 text-left">
              <p className="text-sm font-semibold text-navy-900">Almost there — two quick steps:</p>
              <ol className="mt-2 space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
                <li>Open WhatsApp with the prefilled booking message.</li>
                <li>
                  <strong className="text-navy-900">Press SEND</strong> so our reservations team receives it.
                </li>
              </ol>
            </div>

            <Button asChild className="mt-6 w-full bg-gold-500 text-navy-950 hover:bg-gold-400 py-4">
              <a href={created.whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />
                Request Booking via WhatsApp
              </a>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Opening WhatsApp does not send the message automatically — you must press SEND.
            </p>

            <div className="mt-8 border-t border-border pt-6 text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">What happens next</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-gold-600">1.</span> Our team reviews availability and confirms your reservation
                  over WhatsApp or phone ({waDisplay}).
                </li>
                <li className="flex gap-2">
                  <span className="text-gold-600">2.</span> Once confirmed, your room is locked in for your dates.
                </li>
                <li className="flex gap-2">
                  <span className="text-gold-600">3.</span> No payment is needed until check-in or as arranged with
                  our team.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------- guard views
  if (!category || nights <= 0 || checkIn < today) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
      </div>
    );
  }

  // ------------------------------------------------------------- form view
  return (
    <div className="bg-ivory pt-28 pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <button
          onClick={() => navigate("/booking")}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-navy-900"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to availability
        </button>

        {/* Stepper */}
        <div className="mt-6 flex items-center gap-3">
          {[
            { n: 1, label: "Dates & Room", done: true },
            { n: 2, label: "Guest Details", done: false },
            { n: 3, label: "WhatsApp Request", done: false },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-3">
              {i > 0 && <div className="h-px w-6 md:w-10 bg-border" />}
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center text-xs font-semibold ${
                    s.done ? "bg-gold-500 text-navy-950" : "border border-border bg-card text-muted-foreground"
                  }`}
                >
                  {s.n}
                </span>
                <span className={`text-xs font-medium ${s.done ? "text-navy-900" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-5">
          {/* Form */}
          <div className="lg:col-span-3">
            <div className="border border-border bg-card p-6 md:p-8">
              <h1 className="font-display text-2xl text-navy-900">Your details</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                We only need what&rsquo;s necessary to confirm your reservation.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
                className="mt-6 grid gap-4 sm:grid-cols-2"
              >
                <div className="sm:col-span-2">
                  <Label htmlFor="bk-name">Full name *</Label>
                  <Input
                    id="bk-name"
                    required
                    minLength={2}
                    maxLength={120}
                    value={form.guestName}
                    onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                    placeholder="As it should appear on the reservation"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="bk-phone">Phone / WhatsApp number *</Label>
                  <Input
                    id="bk-phone"
                    required
                    value={form.guestPhone}
                    onChange={(e) => setForm({ ...form, guestPhone: e.target.value })}
                    placeholder="+255 7xx xxx xxx"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="bk-email">Email (optional)</Label>
                  <Input
                    id="bk-email"
                    type="email"
                    value={form.guestEmail}
                    onChange={(e) => setForm({ ...form, guestEmail: e.target.value })}
                    placeholder="For written confirmation"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="bk-adults">
                    <span className="inline-flex items-center gap-1.5">
                      <UserRound className="h-3.5 w-3.5" /> Adults *
                    </span>
                  </Label>
                  <Select
                    value={String(form.adults)}
                    onValueChange={(v) => setForm({ ...form, adults: Number(v) })}
                  >
                    <SelectTrigger id="bk-adults" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: category.maxAdults }, (_, i) => i + 1).map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bk-children">
                    <span className="inline-flex items-center gap-1.5">
                      <Baby className="h-3.5 w-3.5" /> Children
                    </span>
                  </Label>
                  <Select
                    value={String(form.children)}
                    onValueChange={(v) => setForm({ ...form, children: Number(v) })}
                  >
                    <SelectTrigger id="bk-children" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: category.maxChildren + 1 }, (_, i) => i).map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label>Preferred room</Label>
                  <Select value={preferredRoom} onValueChange={setPreferredRoom}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any available room in {category.name}</SelectItem>
                      {freeRooms.map((r) => (
                        <SelectItem key={r.roomId} value={r.roomId}>
                          Room {r.number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    A specific room is held for you while your request is pending.
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="bk-requests">Special requests (optional)</Label>
                  <Textarea
                    id="bk-requests"
                    rows={3}
                    maxLength={1000}
                    value={form.specialRequests}
                    onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
                    placeholder="Airport pickup, late check-in, quiet room..."
                    className="mt-1.5"
                  />
                </div>

                {capacityError && (
                  <div className="sm:col-span-2 flex items-center gap-2 border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-xs text-destructive">
                    <CircleAlert className="h-4 w-4 shrink-0" />
                    {capacityError}
                  </div>
                )}
                {submitError && (
                  <div className="sm:col-span-2 flex items-start gap-2 border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-xs text-destructive">
                    <CircleAlert className="h-4 w-4 shrink-0 mt-0.5" />
                    {submitError}
                  </div>
                )}

                <div className="sm:col-span-2">
                  <Button
                    type="submit"
                    disabled={submitting || !!capacityError}
                    className="w-full bg-gold-500 py-4 text-navy-950 hover:bg-gold-400"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Securing your hold…
                      </>
                    ) : (
                      <>
                        <MessageCircle className="mr-2 h-5 w-5" /> Request Booking via WhatsApp
                      </>
                    )}
                  </Button>
                  <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
                    <Info className="mr-1 inline h-3 w-3" />
                    {content.settings.booking.requestNote}
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Summary */}
          <aside className="lg:col-span-2">
            <div className="border border-border bg-card p-6 lg:sticky lg:top-24">
              <p className="text-xs font-semibold uppercase tracking-brand text-gold-700">Booking summary</p>
              <div className="mt-4 aspect-[16/10] overflow-hidden bg-sand">
                {category.coverImage && (
                   
                  <img src={category.coverImage} alt={category.name} className="h-full w-full object-cover" />
                )}
              </div>
              <h2 className="mt-4 font-display text-xl text-navy-900">{category.name}</h2>
              <div className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-in</span>
                  <span className="font-medium text-navy-900">{formatDateMedium(checkIn)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-out</span>
                  <span className="font-medium text-navy-900">{formatDateMedium(checkOut)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nights</span>
                  <span className="font-medium text-navy-900">{nights}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Guests</span>
                  <span className="font-medium text-navy-900">
                    {form.adults} adult{form.adults > 1 ? "s" : ""}
                    {form.children > 0 ? `, ${form.children} child${form.children > 1 ? "ren" : ""}` : ""}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <span className="text-muted-foreground">
                    {formatTZS(category.pricePerNight)} × {nights} night{nights > 1 ? "s" : ""}
                  </span>
                  <span className="font-semibold text-navy-900">{formatTZS(total)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="font-medium text-navy-900">Estimated total</span>
                  <span className="font-display text-xl text-navy-900">{formatTZS(total)}</span>
                </div>
              </div>
              <div className="mt-5 border border-gold-500/40 bg-accent p-3.5 text-xs leading-relaxed text-muted-foreground">
                Questions? Call or WhatsApp{" "}
                <a href={`https://wa.me/${waNumber}`} className="font-semibold text-gold-700 inline-flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {waDisplay}
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
