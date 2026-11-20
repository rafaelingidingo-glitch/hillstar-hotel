"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiSend } from "@/lib/api-client";
import type { HashRoute } from "@/lib/site-hooks";
import { navigate } from "@/lib/site-hooks";
import { formatTZS, STATUS_LABELS, formatDateShort, formatTimestamp } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Search,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Ban,
  LogIn,
  LogOut,
  UserX,
  Timer,
  DoorOpen,
  NotebookPen,
  Wallet,
  Trash2,
  Phone,
  BedDouble,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#c6a15b",
  CONFIRMED: "#1b3855",
  CHECKED_IN: "#31543c",
  CHECKED_OUT: "#6b7280",
  REJECTED: "#a4382c",
  CANCELLED: "#b0684d",
  EXPIRED: "#8a7ca8",
  NO_SHOW: "#3f4854",
};

interface BookingRow {
  id: string;
  reference: string;
  status: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  adults: number;
  children: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  estimatedTotal: number;
  paidTotal: number;
  paymentStatus: string;
  categoryId: string;
  categoryName: string;
  roomId: string | null;
  roomNumber: string | null;
  specialRequests: string;
  adminNotes: string;
  expiresAt: string | null;
  source: string;
  createdAt: string;
}

interface BookingDetail extends BookingRow {
  payments: { id: string; amount: number; method: string; reference: string; note: string; recordedBy: string; recordedAt: string }[];
  specialRequests: string;
  adminNotes: string;
  confirmedAt: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  closedAt: string | null;
  room: { id: string; number: string } | null;
  category: { id: string; name: string; pricePerNight: number };
}

export function AdminReservationsPage({ route }: { route: HashRoute }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState(route.params.status || "ALL");
  const [from, setFrom] = useState(route.params.from || "");
  const [to, setTo] = useState(route.params.to || "");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(route.params.id || null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, from, to]);

  const listQuery = useQuery({
    queryKey: ["admin-bookings", debouncedSearch, status, from, to, page],
    queryFn: () =>
      apiGet<{ bookings: BookingRow[]; total: number; page: number; totalPages: number }>(
        `/api/admin/bookings?query=${encodeURIComponent(debouncedSearch)}&status=${status}&from=${from}&to=${to}&page=${page}`
      ),
    refetchInterval: 15000,
  });

  const detailQuery = useQuery({
    queryKey: ["admin-booking", selectedId],
    queryFn: () => apiGet<{ booking: BookingDetail; rooms: { id: string; number: string; floor: string }[] }>(`/api/admin/bookings/${selectedId}`),
    enabled: !!selectedId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    if (selectedId) queryClient.invalidateQueries({ queryKey: ["admin-booking", selectedId] });
  };

  const act = async (id: string, action: string, extra?: Record<string, unknown>, successMsg?: string) => {
    try {
      await apiSend(`/api/admin/bookings/${id}`, "PATCH", { action, ...extra });
      invalidate();
      toast({ title: successMsg || "Booking updated" });
    } catch (e) {
      toast({
        title: "Action failed",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const bookings = listQuery.data?.bookings ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-navy-900">Reservations</h1>
          <p className="text-sm text-muted-foreground">
            {listQuery.data?.total ?? "—"} booking records · pending requests hold inventory until expiration
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 border border-border bg-card p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference, guest, phone…"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); if (v !== route.params.status && route.params.status) navigate("/admin/reservations"); }}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {Object.keys(STATUS_LABELS).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[150px]" aria-label="Check-in from" />
          <span className="text-xs text-muted-foreground">→</span>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[150px]" aria-label="Check-in to" />
        </div>
        {(from || to || status !== "ALL" || search) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFrom("");
              setTo("");
              setStatus("ALL");
              setSearch("");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border border-border bg-card">
        <div className="scrollbar-elegant overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left">
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Reference</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Guest</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Room</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Dates</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listQuery.isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-gold-500" />
                  </td>
                </tr>
              )}
              {!listQuery.isLoading && bookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    No bookings match these filters.
                  </td>
                </tr>
              )}
              {bookings.map((b) => {
                const pendingSoon = b.status === "PENDING" && b.expiresAt && new Date(b.expiresAt).getTime() - Date.now() < 5 * 60 * 1000;
                return (
                  <tr key={b.id} className="border-b border-border/60 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedId(b.id)} className="font-medium text-navy-900 hover:text-gold-700">
                        {b.reference}
                      </button>
                      <p className="text-[11px] text-muted-foreground">{b.source === "ADMIN" ? "Created by staff" : "Website"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{b.guestName}</p>
                      <p className="text-[11px] text-muted-foreground">{b.guestPhone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{b.categoryName}</p>
                      <p className="text-[11px] text-muted-foreground">{b.roomNumber ? `Room ${b.roomNumber}` : "Unassigned"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{formatDateShort(b.checkIn)} → {formatDateShort(b.checkOut)}</p>
                      <p className="text-[11px] text-muted-foreground">{b.nights} night{b.nights > 1 ? "s" : ""} · {b.adults}a{b.children > 0 ? ` ${b.children}c` : ""}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{formatTZS(b.estimatedTotal)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {b.paidTotal > 0 ? `Paid ${formatTZS(b.paidTotal)}` : b.paymentStatus === "UNPAID" ? "Unpaid" : b.paymentStatus}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"
                        style={{ background: STATUS_COLORS[b.status] ?? "#8a8f96" }}
                      >
                        {STATUS_LABELS[b.status] ?? b.status}
                      </span>
                      {pendingSoon && (
                        <p className="mt-1 text-[10px] font-semibold text-red-600">expiring soon</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.status === "PENDING" && (
                          <>
                            <button
                              title="Confirm"
                              onClick={() => act(b.id, "confirm", {}, "Booking confirmed")}
                              className="flex h-8 w-8 items-center justify-center border border-emerald-600/40 text-emerald-700 hover:bg-emerald-50"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              title="Reject"
                              onClick={() => act(b.id, "reject", {}, "Request rejected")}
                              className="flex h-8 w-8 items-center justify-center border border-red-600/40 text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                            <button
                              title="Extend pending window"
                              onClick={() => act(b.id, "extend", { extendMinutes: 15 }, "Hold extended by 15 minutes")}
                              className="flex h-8 w-8 items-center justify-center border border-gold-600/40 text-gold-700 hover:bg-accent"
                            >
                              <Timer className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {b.status === "CONFIRMED" && (
                          <>
                            <button
                              title="Check in"
                              onClick={() => act(b.id, "check_in", {}, "Guest checked in")}
                              className="flex h-8 w-8 items-center justify-center border border-emerald-600/40 text-emerald-700 hover:bg-emerald-50"
                            >
                              <LogIn className="h-4 w-4" />
                            </button>
                            <button
                              title="Mark no-show"
                              onClick={() => act(b.id, "no_show", {}, "Marked as no-show")}
                              className="flex h-8 w-8 items-center justify-center border border-slate-500/40 text-slate-600 hover:bg-slate-100"
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                            <button
                              title="Cancel"
                              onClick={() => act(b.id, "cancel", {}, "Booking cancelled")}
                              className="flex h-8 w-8 items-center justify-center border border-red-600/40 text-red-700 hover:bg-red-50"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {b.status === "CHECKED_IN" && (
                          <button
                            title="Check out"
                            onClick={() => act(b.id, "check_out", {}, "Guest checked out")}
                            className="flex h-8 w-8 items-center justify-center border border-navy-700/40 text-navy-800 hover:bg-navy-50"
                          >
                            <LogOut className="h-4 w-4" />
                          </button>
                        )}
                        <a
                          title="WhatsApp guest"
                          href={`https://wa.me/${b.guestPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${b.guestName}, regarding your Hillstar Hotel booking ${b.reference}...`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-8 w-8 items-center justify-center border border-gold-600/40 text-gold-700 hover:bg-accent"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                        <button
                          title="Open details"
                          onClick={() => setSelectedId(b.id)}
                          className="flex h-8 w-8 items-center justify-center border border-border text-muted-foreground hover:bg-muted"
                        >
                          <DoorOpen className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {listQuery.data && listQuery.data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <span>
              Page {listQuery.data.page} of {listQuery.data.totalPages} · {listQuery.data.total} records
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= listQuery.data.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto scrollbar-elegant">
          {detailQuery.isLoading || !detailQuery.data ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-gold-500" />
            </div>
          ) : (
            <BookingDetailPanel
              detail={detailQuery.data.booking}
              rooms={detailQuery.data.rooms}
              act={act}
              onChanged={invalidate}
              onClose={() => setSelectedId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail panel
// ---------------------------------------------------------------------------

function BookingDetailPanel({
  detail: b,
  rooms,
  act,
  onChanged,
  onClose,
}: {
  detail: BookingDetail;
  rooms: { id: string; number: string; floor: string }[];
  act: (id: string, action: string, extra?: Record<string, unknown>, successMsg?: string) => Promise<void>;
  onChanged: () => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [notes, setNotes] = useState(b.adminNotes);
  const [assignRoom, setAssignRoom] = useState(b.roomId || "unassigned");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payRef, setPayRef] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({
    guestName: b.guestName,
    guestPhone: b.guestPhone,
    guestEmail: b.guestEmail,
    adults: b.adults,
    children: b.children,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
  });

  // Re-render every second while a pending hold is ticking
  const [, tickHold] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    if (b.status !== "PENDING" || !b.expiresAt) return;
    const t = setInterval(tickHold, 1000);
    return () => clearInterval(t);
  }, [b.status, b.expiresAt, tickHold]);
  const remaining = (() => {
    if (b.status !== "PENDING" || !b.expiresAt) return null;
    const diff = new Date(b.expiresAt).getTime() - Date.now();
    if (diff <= 0) return "expired";
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${m}m ${String(s).padStart(2, "0")}s`;
  })();

  const savePayment = async () => {
    const amount = parseInt(payAmount, 10);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    try {
      await apiSend(`/api/admin/bookings/${b.id}/payments`, "POST", {
        amount,
        method: payMethod,
        reference: payRef,
        note: "",
      });
      setPayAmount("");
      setPayRef("");
      onChanged();
      toast({ title: "Payment recorded" });
    } catch (e) {
      toast({ title: "Could not record payment", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const deleteBooking = async () => {
    try {
      await apiSend(`/api/admin/bookings/${b.id}`, "DELETE");
      onChanged();
      onClose();
      toast({ title: "Booking deleted" });
    } catch (e) {
      toast({ title: "Could not delete", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const waUrl = `https://wa.me/${b.guestPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
    `Hello ${b.guestName},\n\nYour booking at Hillstar Hotel:\nReference: ${b.reference}\nRoom: ${b.categoryName}${b.roomNumber ? ` (${b.roomNumber})` : ""}\nCheck-in: ${b.checkIn}\nCheck-out: ${b.checkOut}\nStatus: ${STATUS_LABELS[b.status] ?? b.status}\n\nThank you for choosing Hillstar Hotel!`
  )}`;

  return (
    <div>
      <DialogHeader>
        <DialogTitle className="flex flex-wrap items-center gap-3">
          <span className="font-display text-xl">{b.reference}</span>
          <span
            className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"
            style={{ background: STATUS_COLORS[b.status] ?? "#8a8f96" }}
          >
            {STATUS_LABELS[b.status] ?? b.status}
          </span>
          {remaining && b.status === "PENDING" && (
            <span className={`text-xs font-semibold ${remaining === "expired" ? "text-red-600" : "text-gold-700"}`}>
              {remaining === "expired" ? "hold expired — confirm to recheck availability" : `hold expires in ${remaining}`}
            </span>
          )}
        </DialogTitle>
        <DialogDescription>
          Created {formatTimestamp(b.createdAt)} · Source: {b.source === "ADMIN" ? "Admin dashboard" : "Website request"}
        </DialogDescription>
      </DialogHeader>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {/* Guest & stay */}
        <div className="space-y-4">
          <div className="border border-border bg-muted/30 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Guest</h3>
            {!editing ? (
              <div className="mt-3 space-y-1.5 text-sm">
                <p className="font-medium text-navy-900">{b.guestName}</p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> {b.guestPhone}
                </p>
                {b.guestEmail && <p className="text-muted-foreground">{b.guestEmail}</p>}
                <p className="text-muted-foreground">
                  Guests: {b.adults} adult{b.adults > 1 ? "s" : ""}
                  {b.children > 0 ? `, ${b.children} child${b.children > 1 ? "ren" : ""}` : ""}
                </p>
                {b.specialRequests && (
                  <p className="border-l-2 border-gold-500 pl-3 text-xs italic text-muted-foreground">
                    “{b.specialRequests}”
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-3 grid gap-3">
                <div>
                  <Label>Name</Label>
                  <Input value={edit.guestName} onChange={(e) => setEdit({ ...edit, guestName: e.target.value })} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Phone</Label>
                    <Input value={edit.guestPhone} onChange={(e) => setEdit({ ...edit, guestPhone: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={edit.guestEmail} onChange={(e) => setEdit({ ...edit, guestEmail: e.target.value })} className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <Label>Adults</Label>
                    <Input type="number" min={1} max={10} value={edit.adults} onChange={(e) => setEdit({ ...edit, adults: Number(e.target.value) })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Children</Label>
                    <Input type="number" min={0} max={10} value={edit.children} onChange={(e) => setEdit({ ...edit, children: Number(e.target.value) })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Check-in</Label>
                    <Input type="date" value={edit.checkIn} onChange={(e) => setEdit({ ...edit, checkIn: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Check-out</Label>
                    <Input type="date" value={edit.checkOut} onChange={(e) => setEdit({ ...edit, checkOut: e.target.value })} className="mt-1" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-navy-900 text-ivory hover:bg-navy-800"
                    onClick={() =>
                      act(
                        b.id,
                        "update_details",
                        {
                          guestName: edit.guestName,
                          guestPhone: edit.guestPhone,
                          guestEmail: edit.guestEmail,
                          adults: edit.adults,
                          children: edit.children,
                          checkIn: edit.checkIn,
                          checkOut: edit.checkOut,
                        },
                        "Booking details updated"
                      ).then(() => setEditing(false))
                    }
                  >
                    Save changes
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="border border-border bg-muted/30 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stay</h3>
            <div className="mt-3 space-y-1.5 text-sm">
              <p>
                <span className="text-muted-foreground">Room type:</span>{" "}
                <span className="font-medium">{b.category.name}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Dates:</span>{" "}
                <span className="font-medium">
                  {formatDateShort(b.checkIn)} → {formatDateShort(b.checkOut)} ({b.nights} night{b.nights > 1 ? "s" : ""})
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Assigned room:</span>{" "}
                <span className="font-medium">{b.roomNumber ? `Room ${b.roomNumber}` : "Unassigned"}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Estimated total:</span>{" "}
                <span className="font-semibold">{formatTZS(b.estimatedTotal)}</span>
                <span className="text-xs text-muted-foreground">
                  {" "}
                  ({formatTZS(b.category.pricePerNight)} × {b.nights})
                </span>
              </p>
            </div>

            {/* Room assignment */}
            {["PENDING", "CONFIRMED"].includes(b.status) && (
              <div className="mt-4 flex items-end gap-2">
                <div className="flex-1">
                  <Label className="text-[11px]">Assign / reassign room</Label>
                  <Select value={assignRoom} onValueChange={setAssignRoom}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned" disabled>
                        Select a room…
                      </SelectItem>
                      {rooms.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          Room {r.number} {r.floor ? `· floor ${r.floor}` : ""}
                          {r.id === b.roomId ? " (current)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mb-0"
                  disabled={assignRoom === (b.roomId || "unassigned")}
                  onClick={() => act(b.id, "assign_room", { roomId: assignRoom }, "Room assigned")}
                >
                  <BedDouble className="mr-1 h-3.5 w-3.5" /> Assign
                </Button>
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2">History</h3>
            <p>Created: {formatTimestamp(b.createdAt)}</p>
            {b.confirmedAt && <p>Confirmed: {formatTimestamp(b.confirmedAt)}</p>}
            {b.checkedInAt && <p>Checked in: {formatTimestamp(b.checkedInAt)}</p>}
            {b.checkedOutAt && <p>Checked out: {formatTimestamp(b.checkedOutAt)}</p>}
            {b.closedAt && <p>Closed: {formatTimestamp(b.closedAt)}</p>}
            {b.expiresAt && b.status === "PENDING" && <p>Hold expires: {formatTimestamp(b.expiresAt)}</p>}
          </div>
        </div>

        {/* Actions & payments */}
        <div className="space-y-4">
          <div className="border border-border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {["PENDING", "EXPIRED"].includes(b.status) && (
                <Button size="sm" className="bg-emerald-700 text-white hover:bg-emerald-800" onClick={() => act(b.id, "confirm", {}, "Booking confirmed — room locked")}>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Confirm
                </Button>
              )}
              {["PENDING", "EXPIRED"].includes(b.status) && (
                <Button size="sm" variant="outline" className="border-red-600/40 text-red-700 hover:bg-red-50" onClick={() => act(b.id, "reject", {}, "Request rejected")}>
                  <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject
                </Button>
              )}
              {b.status === "PENDING" && (
                <>
                  <Button size="sm" variant="outline" className="border-gold-600/40 text-gold-700 hover:bg-accent" onClick={() => act(b.id, "extend", { extendMinutes: 15 }, "Hold extended by 15 minutes")}>
                    <Timer className="mr-1.5 h-3.5 w-3.5" /> Extend +15m
                  </Button>
                  <Button size="sm" variant="outline" className="border-gold-600/40 text-gold-700 hover:bg-accent" onClick={() => act(b.id, "extend", { extendMinutes: 60 }, "Hold extended by 1 hour")}>
                    <Timer className="mr-1.5 h-3.5 w-3.5" /> Extend +1h
                  </Button>
                </>
              )}
              {b.status === "CONFIRMED" && (
                <>
                  <Button size="sm" className="bg-emerald-700 text-white hover:bg-emerald-800" onClick={() => act(b.id, "check_in", {}, "Guest checked in")}>
                    <LogIn className="mr-1.5 h-3.5 w-3.5" /> Check In
                  </Button>
                  <Button size="sm" variant="outline" className="border-slate-500/40 text-slate-600 hover:bg-slate-100" onClick={() => act(b.id, "no_show", {}, "Marked as no-show")}>
                    <UserX className="mr-1.5 h-3.5 w-3.5" /> No-Show
                  </Button>
                  <Button size="sm" variant="outline" className="border-red-600/40 text-red-700 hover:bg-red-50" onClick={() => act(b.id, "cancel", {}, "Booking cancelled")}>
                    <Ban className="mr-1.5 h-3.5 w-3.5" /> Cancel
                  </Button>
                </>
              )}
              {b.status === "CHECKED_IN" && (
                <Button size="sm" className="bg-navy-900 text-ivory hover:bg-navy-800" onClick={() => act(b.id, "check_out", {}, "Guest checked out")}>
                  <LogOut className="mr-1.5 h-3.5 w-3.5" /> Check Out
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setEditing(!editing)}>
                {editing ? "Close editor" : "Edit details"}
              </Button>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 border border-input bg-transparent px-3 text-sm font-medium hover:bg-accent"
              >
                <MessageCircle className="h-3.5 w-3.5 text-gold-700" /> WhatsApp Guest
              </a>
              {!["PENDING", "CONFIRMED", "CHECKED_IN"].includes(b.status) && b.payments.length === 0 && (
                <Button size="sm" variant="outline" className="border-red-600/40 text-red-700 hover:bg-red-50" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                </Button>
              )}
            </div>
          </div>

          {/* Payments */}
          <div className="border border-border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payments <span className="normal-case text-foreground/70">· paid {formatTZS(b.payments.reduce((s, p) => s + p.amount, 0))} of {formatTZS(b.estimatedTotal)}</span>
            </h3>
            <div className="mt-3 space-y-1.5">
              {b.payments.length === 0 && <p className="text-xs text-muted-foreground">No payments recorded.</p>}
              {b.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b border-border/60 pb-1.5 text-sm">
                  <div>
                    <p className="font-medium">{formatTZS(p.amount)} <span className="text-xs text-muted-foreground">· {p.method.replace("_", " ")}</span></p>
                    {p.reference && <p className="text-[11px] text-muted-foreground">Ref: {p.reference}</p>}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{formatTimestamp(p.recordedAt)}</p>
                </div>
              ))}
            </div>
            {!["REJECTED", "CANCELLED", "EXPIRED"].includes(b.status) && (
              <div className="mt-4 flex items-end gap-2">
                <div className="w-28">
                  <Label className="text-[11px]">Amount (TZS)</Label>
                  <Input value={payAmount} onChange={(e) => setPayAmount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" className="mt-1 h-9" inputMode="numeric" />
                </div>
                <div className="w-36">
                  <Label className="text-[11px]">Method</Label>
                  <Select value={payMethod} onValueChange={setPayMethod}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["CASH", "MOBILE_MONEY", "BANK", "CARD", "OTHER"].map((m) => (
                        <SelectItem key={m} value={m}>
                          {m.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="text-[11px]">Reference</Label>
                  <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="Optional" className="mt-1 h-9" />
                </div>
                <Button size="sm" className="mb-0 bg-gold-500 text-navy-950 hover:bg-gold-400" onClick={savePayment}>
                  <Wallet className="mr-1 h-3.5 w-3.5" /> Record
                </Button>
              </div>
            )}
          </div>

          {/* Internal notes */}
          <div className="border border-border bg-card p-4">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <NotebookPen className="h-3.5 w-3.5" /> Internal notes
            </h3>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes visible to staff only…"
              className="mt-2"
            />
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => act(b.id, "set_notes", { notes }, "Notes saved")}
            >
              Save notes
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete booking {b.reference}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the booking record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction className="bg-red-700 text-white hover:bg-red-800" onClick={deleteBooking}>
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
