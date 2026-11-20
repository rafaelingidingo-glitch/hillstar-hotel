"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiSend, uploadImage } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { formatTZS, formatTimestamp } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, Save, ImagePlus, X, Presentation, Mail, Phone, MessageCircle } from "lucide-react";

interface SeatingRow {
  name: string;
  capacity: number;
}

interface MeetingRoomRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  capacity: number;
  seating: SeatingRow[];
  equipment: string[];
  image: string;
  pricingNote: string;
  hourlyRate: number | null;
  active: boolean;
  sortOrder: number;
}

interface MeetingInquiryRow {
  id: string;
  reference: string;
  organization: string;
  contactPerson: string;
  email: string;
  phone: string;
  eventType: string;
  attendees: number;
  preferredDate: string;
  duration: string;
  roomId: string | null;
  roomName: string | null;
  requirements: string;
  status: string;
  adminNotes: string;
  createdAt: string;
}

const STATUSES = ["NEW", "CONTACTED", "QUOTATION_SENT", "CONFIRMED", "REJECTED"];
const STATUS_COLORS: Record<string, string> = {
  NEW: "#c6a15b",
  CONTACTED: "#1b3855",
  QUOTATION_SENT: "#8a7ca8",
  CONFIRMED: "#31543c",
  REJECTED: "#a4382c",
};

export function AdminMeetingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const roomsQuery = useQuery({
    queryKey: ["admin-meeting-rooms"],
    queryFn: () => apiGet<{ rooms: MeetingRoomRow[] }>("/api/admin/meeting-rooms"),
  });
  const inquiriesQuery = useQuery({
    queryKey: ["admin-meeting-inquiries"],
    queryFn: () => apiGet<{ inquiries: MeetingInquiryRow[] }>("/api/admin/meeting-inquiries"),
    refetchInterval: 20000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-meeting-rooms"] });
    queryClient.invalidateQueries({ queryKey: ["admin-meeting-inquiries"] });
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["public-content"] });
  };

  // Room dialog
  const [roomDialog, setRoomDialog] = useState<"closed" | "new" | "edit">("closed");
  const [roomForm, setRoomForm] = useState({
    name: "",
    description: "",
    capacity: 20,
    seating: [] as SeatingRow[],
    equipment: [] as string[],
    image: "",
    pricingNote: "",
    hasHourlyRate: false,
    hourlyRate: 0,
    active: true,
    sortOrder: 0,
  });
  const [editRoomId, setEditRoomId] = useState<string | null>(null);
  const [seatingInput, setSeatingInput] = useState({ name: "", capacity: 10 });
  const [equipmentInput, setEquipmentInput] = useState("");
  const [saving, setSaving] = useState(false);

  const openNewRoom = () => {
    setRoomForm({
      name: "",
      description: "",
      capacity: 20,
      seating: [],
      equipment: [],
      image: "",
      pricingNote: "",
      hasHourlyRate: false,
      hourlyRate: 0,
      active: true,
      sortOrder: 0,
    });
    setEditRoomId(null);
    setRoomDialog("new");
  };

  const openEditRoom = (r: MeetingRoomRow) => {
    setRoomForm({
      name: r.name,
      description: r.description,
      capacity: r.capacity,
      seating: r.seating,
      equipment: r.equipment,
      image: r.image,
      pricingNote: r.pricingNote,
      hasHourlyRate: r.hourlyRate !== null,
      hourlyRate: r.hourlyRate ?? 0,
      active: r.active,
      sortOrder: r.sortOrder,
    });
    setEditRoomId(r.id);
    setRoomDialog("edit");
  };

  const saveRoom = async () => {
    setSaving(true);
    try {
      const payload = {
        name: roomForm.name,
        description: roomForm.description,
        capacity: roomForm.capacity,
        seating: roomForm.seating,
        equipment: roomForm.equipment,
        image: roomForm.image,
        pricingNote: roomForm.pricingNote,
        hourlyRate: roomForm.hasHourlyRate ? roomForm.hourlyRate : null,
        active: roomForm.active,
        sortOrder: roomForm.sortOrder,
      };
      if (roomDialog === "new") await apiSend("/api/admin/meeting-rooms", "POST", payload);
      else if (editRoomId) await apiSend(`/api/admin/meeting-rooms/${editRoomId}`, "PATCH", payload);
      setRoomDialog("closed");
      invalidate();
      toast({ title: "Meeting room saved" });
    } catch (e) {
      toast({ title: "Save failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateInquiry = async (id: string, patch: { status?: string; adminNotes?: string }) => {
    try {
      await apiSend("/api/admin/meeting-inquiries", "PATCH", { id, ...patch });
      queryClient.invalidateQueries({ queryKey: ["admin-meeting-inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast({ title: "Inquiry updated" });
    } catch (e) {
      toast({ title: "Update failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-navy-900">Meetings & Events</h1>
          <p className="text-sm text-muted-foreground">
            {inquiriesQuery.data
              ? `${inquiriesQuery.data.inquiries.filter((i) => i.status === "NEW").length} new inquiries · `
              : ""}
            Configure spaces and manage event inquiries.
          </p>
        </div>
        <Button onClick={openNewRoom} className="bg-gold-500 text-navy-950 hover:bg-gold-400">
          <Plus className="mr-1.5 h-4 w-4" /> New Meeting Space
        </Button>
      </div>

      {/* Rooms */}
      <div className="grid gap-4 md:grid-cols-2">
        {roomsQuery.isLoading && (
          <div className="py-10 text-center md:col-span-2"><Loader2 className="mx-auto h-6 w-6 animate-spin text-gold-500" /></div>
        )}
        {roomsQuery.data?.rooms.map((r) => (
          <div key={r.id} className="border border-border bg-card overflow-hidden">
            <div className="relative aspect-[16/7] bg-sand">
              {r.image ? (
                 
                <img src={r.image} alt={r.name} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Presentation className="h-8 w-8 text-gold-600/60" />
                </div>
              )}
              {!r.active && (
                <Badge className="absolute top-2 left-2 bg-slate-700 text-white">Hidden</Badge>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-lg text-navy-900">{r.name}</h3>
                <span className="shrink-0 text-xs text-muted-foreground">Up to {r.capacity}</span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.seating.map((s) => (
                  <span key={s.name} className="bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    {s.name} · {s.capacity}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {r.hourlyRate ? `${formatTZS(r.hourlyRate)}/hour · ` : ""}
                {r.pricingNote}
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEditRoom(r)}>
                  <Pencil className="mr-1 h-3 w-3" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-600/40 text-red-700 hover:bg-red-50"
                  onClick={async () => {
                    if (!confirm(`Delete meeting space "${r.name}"?`)) return;
                    try {
                      await apiSend(`/api/admin/meeting-rooms/${r.id}`, "DELETE");
                      invalidate();
                      toast({ title: "Space deleted" });
                    } catch (e) {
                      toast({ title: "Could not delete", description: e instanceof Error ? e.message : "", variant: "destructive" });
                    }
                  }}
                >
                  <Trash2 className="mr-1 h-3 w-3" /> Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Inquiries */}
      <div>
        <h2 className="font-display text-xl text-navy-900">Event inquiries</h2>
        <div className="mt-3 space-y-3">
          {inquiriesQuery.data?.inquiries.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No event inquiries yet.</p>
          )}
          {inquiriesQuery.data?.inquiries.map((inq) => (
            <div key={inq.id} className="border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-navy-900">
                    {inq.reference} · {inq.organization}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {inq.eventType} · {inq.attendees} attendees · {inq.preferredDate || "flexible date"} · {inq.duration}
                    {inq.roomName ? ` · ${inq.roomName}` : ""}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{inq.phone}</span>
                    <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{inq.email}</span>
                    <span className="inline-flex items-center gap-1">Contact: {inq.contactPerson}</span>
                  </p>
                  {inq.requirements && (
                    <p className="mt-1.5 max-w-xl border-l-2 border-gold-500 pl-3 text-xs italic text-muted-foreground">
                      “{inq.requirements}”
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-muted-foreground">Submitted {formatTimestamp(inq.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"
                    style={{ background: STATUS_COLORS[inq.status] ?? "#8a8f96" }}
                  >
                    {inq.status}
                  </span>
                  <select
                    value={inq.status}
                    onChange={(e) => updateInquiry(inq.id, { status: e.target.value })}
                    className="h-8 border border-input bg-transparent px-2 text-xs"
                    aria-label="Update inquiry status"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <a
                    href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${inq.contactPerson}, regarding your ${inq.eventType} inquiry (${inq.reference}) at Hillstar Hotel...`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center border border-gold-600/40 text-gold-700 hover:bg-accent"
                    title="WhatsApp contact"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Room dialog */}
      <Dialog open={roomDialog !== "closed"} onOpenChange={(open) => !open && setRoomDialog("closed")}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto scrollbar-elegant">
          <DialogHeader>
            <DialogTitle>{roomDialog === "new" ? "New meeting space" : `Edit ${roomForm.name}`}</DialogTitle>
            <DialogDescription>Meeting spaces shown on the public meetings page.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Name *</Label>
              <Input value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Max capacity *</Label>
              <Input type="number" min={1} value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) || 1 })} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Textarea rows={3} value={roomForm.description} onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>Seating arrangements</Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  value={seatingInput.name}
                  onChange={(e) => setSeatingInput({ ...seatingInput, name: e.target.value })}
                  placeholder="e.g. Theatre Style"
                  className="flex-1"
                />
                <Input
                  type="number"
                  min={1}
                  value={seatingInput.capacity || ""}
                  onChange={(e) => setSeatingInput({ ...seatingInput, capacity: Number(e.target.value) || 1 })}
                  className="w-24"
                  aria-label="Seating capacity"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (seatingInput.name.trim()) {
                      setRoomForm({ ...roomForm, seating: [...roomForm.seating, { name: seatingInput.name.trim(), capacity: seatingInput.capacity }] });
                      setSeatingInput({ name: "", capacity: 10 });
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {roomForm.seating.map((s, i) => (
                  <span key={s.name + i} className="inline-flex items-center gap-1 bg-muted px-2 py-1 text-xs">
                    {s.name} · {s.capacity}
                    <button onClick={() => setRoomForm({ ...roomForm, seating: roomForm.seating.filter((_, j) => j !== i) })} aria-label={`Remove ${s.name}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label>Equipment</Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  value={equipmentInput}
                  onChange={(e) => setEquipmentInput(e.target.value)}
                  placeholder="e.g. Projector & Screen — press Enter"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && equipmentInput.trim()) {
                      e.preventDefault();
                      setRoomForm({ ...roomForm, equipment: [...roomForm.equipment, equipmentInput.trim()] });
                      setEquipmentInput("");
                    }
                  }}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {roomForm.equipment.map((e, i) => (
                  <span key={e + i} className="inline-flex items-center gap-1 bg-muted px-2 py-1 text-xs">
                    {e}
                    <button onClick={() => setRoomForm({ ...roomForm, equipment: roomForm.equipment.filter((_, j) => j !== i) })} aria-label={`Remove ${e}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label>Photo</Label>
              <div className="mt-1.5 flex items-center gap-3">
                {roomForm.image ? (
                  <div className="relative h-16 w-28 overflow-hidden bg-sand">
                    { }
                    <img src={roomForm.image} alt="Space" className="h-full w-full object-cover" />
                    <button
                      onClick={() => setRoomForm({ ...roomForm, image: "" })}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-navy-950/80 text-white"
                      aria-label="Remove photo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex h-16 w-28 cursor-pointer flex-col items-center justify-center border border-dashed border-border bg-muted/40 text-muted-foreground hover:border-gold-500">
                    <ImagePlus className="h-4 w-4" />
                    <span className="mt-1 text-[10px]">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const url = await uploadImage(file);
                          setRoomForm((f) => ({ ...f, image: url }));
                        } catch (err) {
                          toast({ title: "Upload failed", description: err instanceof Error ? err.message : "", variant: "destructive" });
                        }
                      }}
                    />
                  </label>
                )}
                <Input value={roomForm.image} onChange={(e) => setRoomForm({ ...roomForm, image: e.target.value })} placeholder="…or paste path" className="flex-1" />
              </div>
            </div>
            <div>
              <Label>Pricing note</Label>
              <Input value={roomForm.pricingNote} onChange={(e) => setRoomForm({ ...roomForm, pricingNote: e.target.value })} className="mt-1" placeholder="Shown next to the rate" />
            </div>
            <div>
              <Label>Hourly rate (TZS)</Label>
              <div className="mt-1 flex items-center gap-3">
                <Switch checked={roomForm.hasHourlyRate} onCheckedChange={(v) => setRoomForm({ ...roomForm, hasHourlyRate: v })} />
                <Input
                  inputMode="numeric"
                  disabled={!roomForm.hasHourlyRate}
                  value={roomForm.hourlyRate || ""}
                  onChange={(e) => setRoomForm({ ...roomForm, hourlyRate: Number(e.target.value.replace(/[^0-9]/g, "")) || 0 })}
                  placeholder="Leave off for quotation only"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={roomForm.active} onCheckedChange={(v) => setRoomForm({ ...roomForm, active: v })} />
                Active (public)
              </label>
              <div>
                <Label>Sort order</Label>
                <Input type="number" min={0} value={roomForm.sortOrder} onChange={(e) => setRoomForm({ ...roomForm, sortOrder: Number(e.target.value) || 0 })} className="mt-1 w-24" />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRoomDialog("closed")}>Cancel</Button>
            <Button onClick={saveRoom} disabled={saving || !roomForm.name || roomForm.capacity < 1} className="bg-navy-900 text-ivory hover:bg-navy-800">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {roomDialog === "new" ? "Create space" : "Save changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
