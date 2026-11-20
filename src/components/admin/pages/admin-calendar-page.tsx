"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { STATUS_LABELS } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { navigate } from "@/lib/site-hooks";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CircleDot,
  Clock3,
} from "lucide-react";

interface CalendarCell {
  date: string;
  state: string;
  booking: null | {
    id: string;
    reference: string;
    status: string;
    guestName: string;
    categoryName: string;
    type: "single" | "start" | "end" | "mid";
  };
}

interface CalendarData {
  view: string;
  days: string[];
  rangeStart: string;
  rangeEnd: string;
  rooms: {
    roomId: string;
    number: string;
    floor: string;
    status: string;
    categoryName: string;
    cells: CalendarCell[];
  }[];
}

const CELL_STYLES: Record<string, string> = {
  AVAILABLE: "bg-white text-muted-foreground",
  MAINTENANCE: "bg-amber-100 text-amber-800",
  INACTIVE: "bg-slate-100 text-slate-400",
  PENDING: "bg-gold-500/25 text-gold-800",
  CONFIRMED: "bg-navy-700 text-ivory",
  CHECKED_IN: "bg-emerald-700 text-white",
};

function fmtDayHeader(d: string) {
  const date = new Date(`${d}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: "UTC" }).format(date);
}
function fmtWeekday(d: string) {
  const date = new Date(`${d}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" }).format(date);
}
function fmtMonthTitle(d: string) {
  const date = new Date(`${d}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

export function AdminCalendarPage() {
  const { toast } = useToast();
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [anchor, setAnchor] = useState<string>(() => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Dar_es_Salaam" }).format(new Date()));
  const [selectedBooking, setSelectedBooking] = useState<CalendarData["rooms"][0]["cells"][0]["booking"] | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-calendar", view, anchor],
    queryFn: () => apiGet<CalendarData>(`/api/admin/calendar?view=${view}&date=${anchor}`),
    refetchInterval: 30000,
  });

  const shift = (dir: number) => {
    const d = new Date(`${anchor}T00:00:00Z`);
    if (view === "day") d.setUTCDate(d.getUTCDate() + dir);
    else if (view === "week") d.setUTCDate(d.getUTCDate() + dir * 7);
    else d.setUTCMonth(d.getUTCMonth() + dir);
    setAnchor(d.toISOString().slice(0, 10));
  };

  const title = useMemo(() => {
    if (!data) return "";
    if (view === "day") return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${anchor}T00:00:00Z`));
    if (view === "month") return fmtMonthTitle(data.rangeStart);
    return `${fmtDayHeader(data.rangeStart)} – ${fmtDayHeader(data.rangeEnd)} ${fmtMonthTitle(data.rangeStart).split(" ")[1]}`;
  }, [data, view, anchor]);

  const legend = [
    { label: "Available", cls: "bg-white border border-border" },
    { label: "Pending", cls: "bg-gold-500/25" },
    { label: "Confirmed", cls: "bg-navy-700" },
    { label: "Checked In", cls: "bg-emerald-700" },
    { label: "Maintenance", cls: "bg-amber-100" },
    { label: "Inactive", cls: "bg-slate-100" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-navy-900">Availability Calendar</h1>
          <p className="text-sm text-muted-foreground">Room-by-room occupancy with booking states.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => shift(-1)} aria-label="Previous period">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAnchor(new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Dar_es_Salaam" }).format(new Date()))}
          >
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => shift(1)} aria-label="Next period">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="ml-2 flex gap-1">
            {(["day", "week", "month"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider capitalize ${
                  view === v ? "bg-navy-900 text-ivory" : "border border-border bg-card text-muted-foreground"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-display text-lg text-navy-900">{title}</h2>
          <div className="hidden flex-wrap items-center gap-3 sm:flex">
            {legend.map((l) => (
              <span key={l.label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className={`inline-block h-2.5 w-2.5 ${l.cls}`} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-gold-500" />
          </div>
        ) : !data || data.days.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No data.</p>
        ) : (
          <div className="scrollbar-elegant overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="sticky left-0 z-10 min-w-[130px] border-r border-border bg-muted/40 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Room
                  </th>
                  {data.days.map((d) => {
                    const isToday = d === new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Dar_es_Salaam" }).format(new Date());
                    return (
                      <th
                        key={d}
                        className={`min-w-[34px] border-r border-border px-1 py-1.5 text-center font-medium ${
                          isToday ? "bg-gold-500/15 text-gold-800" : "text-muted-foreground"
                        }`}
                      >
                        <span className="block text-[9px] font-normal uppercase">{fmtWeekday(d).slice(0, 2)}</span>
                        {fmtDayHeader(d)}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {data.rooms.map((room) => (
                  <tr key={room.roomId} className="border-b border-border/50">
                    <td className="sticky left-0 z-10 border-r border-border bg-card px-3 py-1.5">
                      <p className="font-semibold text-navy-900">{room.number}</p>
                      <p className="text-[9px] text-muted-foreground">{room.categoryName}</p>
                    </td>
                    {room.cells.map((cell) => {
                      const isStart = cell.booking?.type === "start" || cell.booking?.type === "single";
                      const cls = CELL_STYLES[cell.state] ?? "bg-white";
                      const bookingCls = cell.booking
                        ? `${CELL_STYLES[cell.state] ?? ""} ${isStart ? "border-l-2 border-l-navy-950/50" : ""} ${
                            cell.booking.type === "end" ? "border-r-2 border-r-navy-950/50" : ""
                          }`
                        : cls;
                      return (
                        <td key={cell.date} className="border-r border-b border-border/40 p-[1px]">
                          <button
                            onClick={() => {
                              if (cell.booking) {
                                setSelectedBooking(cell.booking);
                              } else {
                                toast({
                                  title: `Room ${room.number} · ${cell.date}`,
                                  description:
                                    cell.state === "MAINTENANCE"
                                      ? "Under maintenance"
                                      : cell.state === "INACTIVE"
                                      ? "Inactive"
                                      : "Available for bookings",
                                });
                              }
                            }}
                            className={`flex h-8 w-full items-center justify-center px-0.5 text-[9px] leading-none transition-opacity hover:opacity-80 ${bookingCls}`}
                            title={
                              cell.booking
                                ? `${cell.booking.reference} · ${cell.booking.guestName} (${STATUS_LABELS[cell.booking.status] ?? cell.booking.status})`
                                : cell.state
                            }
                            aria-label={`Room ${room.number} on ${cell.date}: ${cell.booking ? cell.booking.guestName : cell.state}`}
                          >
                            {cell.booking && (isStart || data.days.length <= 8) ? (
                              <span className="truncate font-medium">{cell.booking.guestName.split(" ")[0]}</span>
                            ) : cell.state === "MAINTENANCE" ? (
                              <span className="text-[8px] uppercase tracking-wide">M</span>
                            ) : null}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {data.rooms.length === 0 && (
                  <tr>
                    <td colSpan={data.days.length + 1} className="px-4 py-10 text-center text-muted-foreground">
                      No rooms configured yet. Create rooms under the Rooms tab.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected booking quick actions */}
      {selectedBooking && (
        <div className="fixed bottom-6 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 border border-border bg-navy-950 p-4 text-ivory shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold">
                <CircleDot className="h-3.5 w-3.5 text-gold-500" />
                {selectedBooking.reference}
              </p>
              <p className="mt-1 text-xs text-ivory/70">
                {selectedBooking.guestName} · {selectedBooking.categoryName}
              </p>
              <p className="mt-0.5 text-[11px] text-ivory/50">
                Status: {STATUS_LABELS[selectedBooking.status] ?? selectedBooking.status}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-gold-500 text-navy-950 hover:bg-gold-400" onClick={() => navigate(`/admin/reservations?id=${selectedBooking.id}`)}>
                Manage
              </Button>
              <Button size="sm" variant="ghost" className="text-ivory/70" onClick={() => setSelectedBooking(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock3 className="h-3.5 w-3.5" />
        Pending holds appear in gold and expire automatically; confirmed bookings block their room until checkout.
      </p>
    </div>
  );
}
