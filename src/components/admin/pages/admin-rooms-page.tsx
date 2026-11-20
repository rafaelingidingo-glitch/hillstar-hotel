"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiSend, uploadImage } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { formatTZS } from "@/lib/format";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  BedDouble,
  Wrench,
  ImagePlus,
  X,
  Save,
} from "lucide-react";

interface RoomMini {
  id: string;
  number: string;
  floor: string;
  status: string;
  notes: string;
}

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  pricePerNight: number;
  maxAdults: number;
  maxChildren: number;
  maxTotalGuests: number;
  bedConfiguration: string;
  sizeSqm: number | null;
  amenities: string[];
  coverImage: string;
  images: string[];
  featured: boolean;
  active: boolean;
  sortOrder: number;
  rooms: RoomMini[];
}

interface RoomRow {
  id: string;
  number: string;
  categoryId: string;
  categoryName: string;
  floor: string;
  notes: string;
  status: string;
}

const emptyCategory = {
  name: "",
  tagline: "",
  description: "",
  pricePerNight: 0,
  maxAdults: 2,
  maxChildren: 0,
  maxTotalGuests: 2,
  bedConfiguration: "",
  sizeSqm: 0,
  amenities: [] as string[],
  coverImage: "",
  images: [] as string[],
  featured: false,
  active: true,
  sortOrder: 0,
};

export function AdminRoomsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"categories" | "rooms">("categories");

  const categoriesQuery = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => apiGet<{ categories: CategoryRow[] }>("/api/admin/categories"),
  });
  const roomsQuery = useQuery({
    queryKey: ["admin-rooms"],
    queryFn: () => apiGet<{ rooms: RoomRow[] }>("/api/admin/rooms"),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["public-content"] });
  };

  // ----------------------------------------------------------- Category dialog
  const [catDialog, setCatDialog] = useState<"closed" | "new" | "edit">("closed");
  const [catForm, setCatForm] = useState<typeof emptyCategory>(emptyCategory);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [amenityInput, setAmenityInput] = useState("");
  const [savingCat, setSavingCat] = useState(false);

  const openNewCategory = () => {
    setCatForm(emptyCategory);
    setEditCatId(null);
    setCatDialog("new");
  };
  const openEditCategory = (c: CategoryRow) => {
    setCatForm({
      name: c.name,
      tagline: c.tagline,
      description: c.description,
      pricePerNight: c.pricePerNight,
      maxAdults: c.maxAdults,
      maxChildren: c.maxChildren,
      maxTotalGuests: c.maxTotalGuests,
      bedConfiguration: c.bedConfiguration,
      sizeSqm: c.sizeSqm ?? 0,
      amenities: c.amenities,
      coverImage: c.coverImage,
      images: c.images,
      featured: c.featured,
      active: c.active,
      sortOrder: c.sortOrder,
    });
    setEditCatId(c.id);
    setCatDialog("edit");
  };

  const saveCategory = async () => {
    setSavingCat(true);
    try {
      const payload = {
        ...catForm,
        sizeSqm: catForm.sizeSqm > 0 ? catForm.sizeSqm : null,
        maxTotalGuests: Math.max(catForm.maxTotalGuests, catForm.maxAdults),
      };
      if (catDialog === "new") {
        await apiSend("/api/admin/categories", "POST", payload);
        toast({ title: "Room category created" });
      } else if (editCatId) {
        await apiSend(`/api/admin/categories/${editCatId}`, "PATCH", payload);
        toast({ title: "Room category updated" });
      }
      setCatDialog("closed");
      invalidate();
    } catch (e) {
      toast({ title: "Save failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setSavingCat(false);
    }
  };

  const deleteCategory = async (c: CategoryRow) => {
    if (!confirm(`Delete category "${c.name}"? This cannot be undone.`)) return;
    try {
      await apiSend(`/api/admin/categories/${c.id}`, "DELETE");
      invalidate();
      toast({ title: "Category deleted" });
    } catch (e) {
      toast({ title: "Could not delete", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  // ----------------------------------------------------------- Room dialog
  const [roomDialog, setRoomDialog] = useState<"closed" | "new" | "edit">("closed");
  const [roomForm, setRoomForm] = useState({ number: "", categoryId: "", floor: "", notes: "", status: "AVAILABLE" });
  const [editRoomId, setEditRoomId] = useState<string | null>(null);
  const [savingRoom, setSavingRoom] = useState(false);

  const openNewRoom = () => {
    setRoomForm({
      number: "",
      categoryId: categoriesQuery.data?.categories[0]?.id ?? "",
      floor: "",
      notes: "",
      status: "AVAILABLE",
    });
    setEditRoomId(null);
    setRoomDialog("new");
  };
  const openEditRoom = (r: RoomRow) => {
    setRoomForm({ number: r.number, categoryId: r.categoryId, floor: r.floor, notes: r.notes, status: r.status });
    setEditRoomId(r.id);
    setRoomDialog("edit");
  };

  const saveRoom = async () => {
    setSavingRoom(true);
    try {
      if (roomDialog === "new") {
        await apiSend("/api/admin/rooms", "POST", roomForm);
        toast({ title: `Room ${roomForm.number} created` });
      } else if (editRoomId) {
        await apiSend(`/api/admin/rooms/${editRoomId}`, "PATCH", roomForm);
        toast({ title: `Room ${roomForm.number} updated` });
      }
      setRoomDialog("closed");
      invalidate();
    } catch (e) {
      toast({ title: "Save failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setSavingRoom(false);
    }
  };

  const deleteRoom = async (r: RoomRow) => {
    if (!confirm(`Delete room ${r.number}? This cannot be undone.`)) return;
    try {
      await apiSend(`/api/admin/rooms/${r.id}`, "DELETE");
      invalidate();
      toast({ title: `Room ${r.number} deleted` });
    } catch (e) {
      toast({ title: "Could not delete", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      AVAILABLE: { label: "Available", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
      MAINTENANCE: { label: "Maintenance", cls: "bg-amber-100 text-amber-800 border-amber-200" },
      INACTIVE: { label: "Inactive", cls: "bg-slate-100 text-slate-600 border-slate-200" },
    };
    const v = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground border-border" };
    return <Badge variant="outline" className={v.cls}>{v.label}</Badge>;
  };

  const stats = useMemo(() => {
    const rooms = roomsQuery.data?.rooms ?? [];
    return {
      total: rooms.length,
      available: rooms.filter((r) => r.status === "AVAILABLE").length,
      maintenance: rooms.filter((r) => r.status === "MAINTENANCE").length,
      inactive: rooms.filter((r) => r.status === "INACTIVE").length,
    };
  }, [roomsQuery.data]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-navy-900">Room Inventory</h1>
          <p className="text-sm text-muted-foreground">
            {stats.total} rooms · {stats.available} available · {stats.maintenance} maintenance · {stats.inactive} inactive
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={openNewCategory}
            className="bg-navy-900 text-ivory hover:bg-navy-800"
          >
            <Plus className="mr-1.5 h-4 w-4" /> New Category
          </Button>
          <Button onClick={openNewRoom} className="bg-gold-500 text-navy-950 hover:bg-gold-400">
            <Plus className="mr-1.5 h-4 w-4" /> New Room
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        {(["categories", "rooms"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              tab === t ? "bg-navy-900 text-ivory" : "border border-border bg-card text-muted-foreground hover:text-navy-900"
            }`}
          >
            {t === "categories" ? `Categories (${categoriesQuery.data?.categories.length ?? 0})` : `Physical Rooms (${stats.total})`}
          </button>
        ))}
      </div>

      {tab === "categories" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categoriesQuery.isLoading && (
            <div className="py-10 text-center md:col-span-2 xl:col-span-3">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-gold-500" />
            </div>
          )}
          {categoriesQuery.data?.categories.map((c) => (
            <div key={c.id} className="border border-border bg-card overflow-hidden">
              <div className="relative aspect-[16/8] bg-sand">
                {c.coverImage ? (
                   
                  <img src={c.coverImage} alt={c.name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BedDouble className="h-8 w-8 text-gold-600/60" />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1.5">
                  {!c.active && <Badge className="bg-slate-700 text-white">Hidden</Badge>}
                  {c.featured && <Badge className="bg-gold-500 text-navy-950">Featured</Badge>}
                </div>
                <span className="absolute bottom-2 right-2 bg-navy-950/85 px-2.5 py-1 text-xs font-semibold text-gold-400">
                  {formatTZS(c.pricePerNight)}/night
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-lg text-navy-900">{c.name}</h3>
                    <p className="text-[11px] uppercase tracking-wide text-gold-700">{c.tagline}</p>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {c.rooms.filter((r) => r.status === "AVAILABLE").length}/{c.rooms.length} rooms
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <span>{c.bedConfiguration || "—"}</span>
                  <span>Max {c.maxTotalGuests} guests</span>
                  {c.sizeSqm ? <span>{c.sizeSqm} m²</span> : null}
                  <span>{c.amenities.length} amenities</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditCategory(c)}>
                    <Pencil className="mr-1 h-3 w-3" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="border-red-600/40 text-red-700 hover:bg-red-50" onClick={() => deleteCategory(c)}>
                    <Trash2 className="mr-1 h-3 w-3" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "rooms" && (
        <div className="border border-border bg-card">
          <div className="scrollbar-elegant overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Room</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Category</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Floor</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roomsQuery.isLoading && (
                  <tr><td colSpan={6} className="py-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-gold-500" /></td></tr>
                )}
                {roomsQuery.data?.rooms.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 hover:bg-muted/30">
                    <td className="px-4 py-3 font-semibold text-navy-900">Room {r.number}</td>
                    <td className="px-4 py-3">{r.categoryName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.floor || "—"}</td>
                    <td className="px-4 py-3">{statusBadge(r.status)}</td>
                    <td className="px-4 py-3 max-w-[220px] truncate text-muted-foreground">{r.notes || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {r.status !== "MAINTENANCE" && (
                          <button
                            title="Mark for maintenance"
                            onClick={() => apiSend(`/api/admin/rooms/${r.id}`, "PATCH", { status: "MAINTENANCE" }).then(invalidate).catch((e) => toast({ title: "Failed", description: e.message, variant: "destructive" }))}
                            className="flex h-8 w-8 items-center justify-center border border-amber-600/40 text-amber-700 hover:bg-amber-50"
                          >
                            <Wrench className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {r.status === "MAINTENANCE" && (
                          <button
                            title="Return to available"
                            onClick={() => apiSend(`/api/admin/rooms/${r.id}`, "PATCH", { status: "AVAILABLE" }).then(invalidate).catch((e) => toast({ title: "Failed", description: e.message, variant: "destructive" }))}
                            className="flex h-8 w-8 items-center justify-center border border-emerald-600/40 text-emerald-700 hover:bg-emerald-50"
                          >
                            <BedDouble className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          title="Edit"
                          onClick={() => openEditRoom(r)}
                          className="flex h-8 w-8 items-center justify-center border border-border text-muted-foreground hover:bg-muted"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          title="Delete"
                          onClick={() => deleteRoom(r)}
                          className="flex h-8 w-8 items-center justify-center border border-red-600/40 text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category dialog */}
      <Dialog open={catDialog !== "closed"} onOpenChange={(open) => !open && setCatDialog("closed")}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-elegant">
          <DialogHeader>
            <DialogTitle>{catDialog === "new" ? "New room category" : `Edit ${catForm.name}`}</DialogTitle>
            <DialogDescription>
              Categories define pricing, capacity and the public presentation of room types.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Name *</Label>
              <Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} className="mt-1" placeholder="e.g. Deluxe Room" />
            </div>
            <div>
              <Label>Tagline</Label>
              <Input value={catForm.tagline} onChange={(e) => setCatForm({ ...catForm, tagline: e.target.value })} className="mt-1" placeholder="Short marketing line" />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Textarea rows={3} value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Price per night (TZS) *</Label>
              <Input
                inputMode="numeric"
                value={catForm.pricePerNight || ""}
                onChange={(e) => setCatForm({ ...catForm, pricePerNight: Number(e.target.value.replace(/[^0-9]/g, "")) || 0 })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Bed configuration</Label>
              <Input value={catForm.bedConfiguration} onChange={(e) => setCatForm({ ...catForm, bedConfiguration: e.target.value })} className="mt-1" placeholder="1 Queen Bed" />
            </div>
            <div>
              <Label>Max adults *</Label>
              <Input type="number" min={1} max={10} value={catForm.maxAdults} onChange={(e) => setCatForm({ ...catForm, maxAdults: Number(e.target.value) || 1 })} className="mt-1" />
            </div>
            <div>
              <Label>Max children</Label>
              <Input type="number" min={0} max={10} value={catForm.maxChildren} onChange={(e) => setCatForm({ ...catForm, maxChildren: Number(e.target.value) || 0 })} className="mt-1" />
            </div>
            <div>
              <Label>Max total guests *</Label>
              <Input type="number" min={1} max={20} value={catForm.maxTotalGuests} onChange={(e) => setCatForm({ ...catForm, maxTotalGuests: Number(e.target.value) || 1 })} className="mt-1" />
            </div>
            <div>
              <Label>Size (m²)</Label>
              <Input type="number" min={0} value={catForm.sizeSqm || ""} onChange={(e) => setCatForm({ ...catForm, sizeSqm: Number(e.target.value) || 0 })} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>Amenities (press Enter to add)</Label>
              <Input
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && amenityInput.trim()) {
                    e.preventDefault();
                    setCatForm({ ...catForm, amenities: [...catForm.amenities, amenityInput.trim()] });
                    setAmenityInput("");
                  }
                }}
                className="mt-1"
                placeholder="Type and press Enter"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {catForm.amenities.map((a, i) => (
                  <span key={a + i} className="inline-flex items-center gap-1 bg-muted px-2 py-1 text-xs">
                    {a}
                    <button
                      onClick={() => setCatForm({ ...catForm, amenities: catForm.amenities.filter((_, j) => j !== i) })}
                      aria-label={`Remove ${a}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label>Cover image</Label>
              <div className="mt-1.5 flex items-center gap-3">
                {catForm.coverImage ? (
                  <div className="relative h-16 w-24 overflow-hidden bg-sand">
                    { }
                    <img src={catForm.coverImage} alt="Cover" className="h-full w-full object-cover" />
                    <button
                      onClick={() => setCatForm({ ...catForm, coverImage: "" })}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-navy-950/80 text-white"
                      aria-label="Remove cover image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex h-16 w-24 cursor-pointer flex-col items-center justify-center border border-dashed border-border bg-muted/40 text-muted-foreground hover:border-gold-500">
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
                          setCatForm((f) => ({ ...f, coverImage: url }));
                        } catch (err) {
                          toast({ title: "Upload failed", description: err instanceof Error ? err.message : "", variant: "destructive" });
                        }
                      }}
                    />
                  </label>
                )}
                <Input
                  value={catForm.coverImage}
                  onChange={(e) => setCatForm({ ...catForm, coverImage: e.target.value })}
                  placeholder="…or paste an image path/URL"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={catForm.featured} onCheckedChange={(v) => setCatForm({ ...catForm, featured: v })} />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={catForm.active} onCheckedChange={(v) => setCatForm({ ...catForm, active: v })} />
                Active (public)
              </label>
            </div>
            <div>
              <Label>Sort order</Label>
              <Input type="number" min={0} value={catForm.sortOrder} onChange={(e) => setCatForm({ ...catForm, sortOrder: Number(e.target.value) || 0 })} className="mt-1" />
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCatDialog("closed")}>
              Cancel
            </Button>
            <Button onClick={saveCategory} disabled={savingCat || !catForm.name || catForm.pricePerNight <= 0} className="bg-navy-900 text-ivory hover:bg-navy-800">
              {savingCat ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {catDialog === "new" ? "Create category" : "Save changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Room dialog */}
      <Dialog open={roomDialog !== "closed"} onOpenChange={(open) => !open && setRoomDialog("closed")}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{roomDialog === "new" ? "New physical room" : `Edit room ${roomForm.number}`}</DialogTitle>
            <DialogDescription>Physical rooms are the actual sellable inventory units.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Room number *</Label>
              <Input value={roomForm.number} onChange={(e) => setRoomForm({ ...roomForm, number: e.target.value })} className="mt-1" placeholder="e.g. 101" />
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={roomForm.categoryId} onValueChange={(v) => setRoomForm({ ...roomForm, categoryId: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesQuery.data?.categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Floor</Label>
              <Input value={roomForm.floor} onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })} className="mt-1" placeholder="e.g. 1" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={roomForm.status} onValueChange={(v) => setRoomForm({ ...roomForm, status: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available (sellable)</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance (blocked)</SelectItem>
                  <SelectItem value="INACTIVE">Inactive (hidden)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Internal notes</Label>
              <Textarea rows={2} value={roomForm.notes} onChange={(e) => setRoomForm({ ...roomForm, notes: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRoomDialog("closed")}>
              Cancel
            </Button>
            <Button onClick={saveRoom} disabled={savingRoom || !roomForm.number || !roomForm.categoryId} className="bg-navy-900 text-ivory hover:bg-navy-800">
              {savingRoom ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {roomDialog === "new" ? "Create room" : "Save changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
