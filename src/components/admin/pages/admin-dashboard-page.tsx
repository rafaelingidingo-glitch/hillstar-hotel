"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { navigate } from "@/lib/site-hooks";
import { formatTZS, STATUS_LABELS, formatDateShort } from "@/lib/format";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BookUser,
  Hourglass,
  CheckCircle2,
  BedDouble,
  Wrench,
  TrendingUp,
  UtensilsCrossed,
  Presentation,
  LogIn,
  LogOut,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface DashboardData {
  stats: {
    totalReservations: number;
    pendingRequests: number;
    confirmedBookings: number;
    currentlyCheckedIn: number;
    todayCheckIns: number;
    todayCheckOuts: number;
    occupiedRooms: number;
    availableRooms: number;
    maintenanceRooms: number;
    totalSellableRooms: number;
    monthlyRevenue: number;
    restaurantNewInquiries: number;
    meetingNewInquiries: number;
    unreadNotifications: number;
  };
  occupancyTrend: { date: string; occupancy: number; arrivals: number; departures: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  monthStatusCounts: Record<string, number>;
  recentBookings: {
    id: string;
    reference: string;
    status: string;
    guestName: string;
    categoryName: string;
    roomNumber: string | null;
    checkIn: string;
    checkOut: string;
    estimatedTotal: number;
    createdAt: string;
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#c6a15b",
  CONFIRMED: "#1b3855",
  CHECKED_IN: "#7c9a72",
  CHECKED_OUT: "#8a8f96",
  REJECTED: "#a4382c",
  CANCELLED: "#b0684d",
  EXPIRED: "#8a7ca8",
  NO_SHOW: "#5d6570",
};

function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "navy",
  onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  tone?: "navy" | "gold" | "green" | "red";
  onClick?: () => void;
}) {
  const tones: Record<string, string> = {
    navy: "bg-navy-900 text-ivory",
    gold: "bg-gold-500 text-navy-950",
    green: "bg-[#31543c] text-ivory",
    red: "bg-[#7e2f26] text-ivory",
  };
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`flex items-start justify-between gap-3 border border-border bg-card p-4 text-left transition-all ${
        onClick ? "hover:shadow-md hover:-translate-y-0.5 cursor-pointer" : ""
      }`}
    >
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-2 font-display text-3xl leading-none text-foreground">{value}</p>
        {sub && <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center ${tones[tone]}`}>{icon}</span>
    </button>
  );
}

export function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => apiGet<DashboardData>("/api/admin/dashboard"),
    refetchInterval: 20000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-gold-500" />
      </div>
    );
  }

  const s = data.stats;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-navy-900">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Today at Hillstar — live operational overview (Africa/Dar_es_Salaam).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/admin/reservations")}
            className="inline-flex items-center gap-2 bg-navy-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ivory hover:bg-navy-800"
          >
            Manage Reservations <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Reservations" value={s.totalReservations} icon={<BookUser className="h-4 w-4" />} onClick={() => navigate("/admin/reservations")} />
        <StatCard label="Pending Requests" value={s.pendingRequests} sub="awaiting confirmation" icon={<Hourglass className="h-4 w-4" />} tone="gold" onClick={() => navigate("/admin/reservations?status=PENDING")} />
        <StatCard label="Confirmed Bookings" value={s.confirmedBookings} icon={<CheckCircle2 className="h-4 w-4" />} tone="green" onClick={() => navigate("/admin/reservations?status=CONFIRMED")} />
        <StatCard label="Checked In Now" value={s.currentlyCheckedIn} icon={<BedDouble className="h-4 w-4" />} onClick={() => navigate("/admin/reservations?status=CHECKED_IN")} />
        <StatCard label="Today's Check-ins" value={s.todayCheckIns} icon={<LogIn className="h-4 w-4" />} onClick={() => navigate("/admin/calendar")} />
        <StatCard label="Today's Check-outs" value={s.todayCheckOuts} icon={<LogOut className="h-4 w-4" />} onClick={() => navigate("/admin/calendar")} />
        <StatCard
          label="Occupied / Available"
          value={`${s.occupiedRooms} / ${s.availableRooms}`}
          sub={`${s.totalSellableRooms} sellable rooms`}
          icon={<BedDouble className="h-4 w-4" />}
          tone="navy"
          onClick={() => navigate("/admin/rooms")}
        />
        <StatCard label="Maintenance Rooms" value={s.maintenanceRooms} icon={<Wrench className="h-4 w-4" />} tone="red" onClick={() => navigate("/admin/rooms")} />
        <StatCard label="Monthly Revenue" value={formatTZS(s.monthlyRevenue)} sub="recorded payments this month" icon={<TrendingUp className="h-4 w-4" />} tone="gold" onClick={() => navigate("/admin/reports?type=revenue")} />
        <StatCard label="Restaurant Inquiries" value={s.restaurantNewInquiries} sub="new" icon={<UtensilsCrossed className="h-4 w-4" />} onClick={() => navigate("/admin/restaurant?tab=inquiries")} />
        <StatCard label="Meeting Inquiries" value={s.meetingNewInquiries} sub="new" icon={<Presentation className="h-4 w-4" />} onClick={() => navigate("/admin/meetings")} />
        <StatCard
          label="Occupancy Rate"
          value={
            s.totalSellableRooms > 0
              ? `${Math.round((s.occupiedRooms / s.totalSellableRooms) * 100)}%`
              : "—"
          }
          sub="rooms occupied now"
          icon={<TrendingUp className="h-4 w-4" />}
          onClick={() => navigate("/admin/reports?type=occupancy")}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Occupancy — last 14 days
            </h2>
            <span className="text-xs text-muted-foreground">% of sellable rooms</span>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.occupancyTrend}>
                <defs>
                  <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c6a15b" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#c6a15b" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d2" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#66707a" }}
                  tickFormatter={(v: string) => v.slice(5)}
                  axisLine={{ stroke: "#e6e0d2" }}
                  tickLine={false}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#66707a" }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: "#0b1d33", border: "none", fontSize: 12, color: "#f7f4ec" }}
                  labelStyle={{ color: "#dfc285" }}
                  formatter={(value: number | string) => [`${value}%`, "Occupancy"]}
                />
                <Area type="monotone" dataKey="occupancy" stroke="#c6a15b" strokeWidth={2} fill="url(#occGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Revenue — recorded payments
          </h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d2" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#66707a" }} axisLine={{ stroke: "#e6e0d2" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#66707a" }} axisLine={false} tickLine={false} width={44} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                <Tooltip
                  contentStyle={{ background: "#0b1d33", border: "none", fontSize: 12, color: "#f7f4ec" }}
                  labelStyle={{ color: "#dfc285" }}
                  formatter={(value: number | string) => [formatTZS(Number(value)), "Revenue"]}
                />
                <Bar dataKey="revenue" fill="#1b3855" maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Month bookings by status + recent bookings */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            This month&rsquo;s bookings by status
          </h2>
          <div className="mt-4 space-y-2.5">
            {Object.keys(data.monthStatusCounts).length === 0 && (
              <p className="text-xs text-muted-foreground">No bookings created this month yet.</p>
            )}
            {Object.entries(data.monthStatusCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0"
                    style={{ background: STATUS_COLORS[status] ?? "#8a8f96" }}
                  />
                  <span className="flex-1 text-sm text-foreground/80">{STATUS_LABELS[status] ?? status}</span>
                  <span className="text-sm font-semibold text-navy-900">{count}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent bookings</h2>
            <button
              onClick={() => navigate("/admin/reservations")}
              className="text-xs text-gold-700 hover:text-gold-600 font-medium"
            >
              View all
            </button>
          </div>
          <div className="mt-3 divide-y divide-border/70">
            {data.recentBookings.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">No bookings yet.</p>
            )}
            {data.recentBookings.map((b) => (
              <button
                key={b.id}
                onClick={() => navigate(`/admin/reservations?id=${b.id}`)}
                className="flex w-full items-center justify-between gap-3 py-2.5 text-left hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy-900">
                    {b.guestName} <span className="text-muted-foreground">· {b.reference}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {b.categoryName}
                    {b.roomNumber ? ` · Room ${b.roomNumber}` : ""} · {formatDateShort(b.checkIn)} → {formatDateShort(b.checkOut)}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                    style={{ background: STATUS_COLORS[b.status] ?? "#8a8f96" }}
                  >
                    {STATUS_LABELS[b.status] ?? b.status}
                  </span>
                  <p className="mt-1 text-xs text-muted-foreground">{formatTZS(b.estimatedTotal)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
