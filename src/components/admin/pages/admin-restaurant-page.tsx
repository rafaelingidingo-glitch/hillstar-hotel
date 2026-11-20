"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiSend, uploadImage } from "@/lib/api-client";
import type { HashRoute } from "@/lib/site-hooks";
import { navigate } from "@/lib/site-hooks";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2, Save, ImagePlus, UtensilsCrossed, Star } from "lucide-react";

interface MenuCategoryRow {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  active: boolean;
  items: MenuItemRow[];
}

interface MenuItemRow {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  featured: boolean;
  sortOrder: number;
}

interface RestaurantInquiryRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  partySize: number;
  note: string;
  status: string;
  adminNotes: string;
  createdAt: string;
}

const INQUIRY_STATUSES = ["NEW", "CONTACTED", "CONFIRMED", "REJECTED"];
const STATUS_COLORS: Record<string, string> = {
  NEW: "#c6a15b",
  CONTACTED: "#1b3855",
  CONFIRMED: "#31543c",
  REJECTED: "#a4382c",
};

export function AdminRestaurantPage({ route }: { route: HashRoute }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Tab is derived from the URL so links (e.g. notifications) can deep-link to inquiries.
  const tab: "menu" | "inquiries" = route.params.tab === "inquiries" ? "inquiries" : "menu";

  const menuQuery = useQuery({
    queryKey: ["admin-menu"],
    queryFn: () => apiGet<{ categories: MenuCategoryRow[] }>("/api/admin/menu-categories"),
  });
  const inquiriesQuery = useQuery({
    queryKey: ["admin-restaurant-inquiries"],
    queryFn: () => apiGet<{ inquiries: RestaurantInquiryRow[] }>("/api/admin/restaurant-inquiries"),
    enabled: tab === "inquiries",
    refetchInterval: 20000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-menu"] });
    queryClient.invalidateQueries({ queryKey: ["public-content"] });
  };

  // --------------------------------------------------- Menu category dialog
  const [catDialog, setCatDialog] = useState<"closed" | "new" | "edit">("closed");
  const [catForm, setCatForm] = useState({ name: "", description: "", sortOrder: 0, active: true });
  const [editCatId, setEditCatId] = useState<string | null>(null);

  const saveCat = async () => {
    try {
      if (catDialog === "new") await apiSend("/api/admin/menu-categories", "POST", catForm);
      else if (editCatId) await apiSend(`/api/admin/menu-categories/${editCatId}`, "PATCH", catForm);
      setCatDialog("closed");
      invalidate();
      toast({ title: "Menu category saved" });
    } catch (e) {
      toast({ title: "Save failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  // --------------------------------------------------- Menu item dialog
  const [itemDialog, setItemDialog] = useState<"closed" | "new" | "edit">("closed");
  const [itemForm, setItemForm] = useState({
    categoryId: "",
    name: "",
    description: "",
    price: 0,
    image: "",
    available: true,
    featured: false,
    sortOrder: 0,
  });
  const [editItemId, setEditItemId] = useState<string | null>(null);

  const openNewItem = (categoryId?: string) => {
    setItemForm({
      categoryId: categoryId || menuQuery.data?.categories[0]?.id || "",
      name: "",
      description: "",
      price: 0,
      image: "",
      available: true,
      featured: false,
      sortOrder: 0,
    });
    setEditItemId(null);
    setItemDialog("new");
  };

  const saveItem = async () => {
    try {
      if (itemDialog === "new") await apiSend("/api/admin/menu-items", "POST", itemForm);
      else if (editItemId) await apiSend(`/api/admin/menu-items/${editItemId}`, "PATCH", itemForm);
      setItemDialog("closed");
      invalidate();
      toast({ title: "Menu item saved" });
    } catch (e) {
      toast({ title: "Save failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const updateInquiry = async (id: string, patch: { status?: string; adminNotes?: string }) => {
    try {
      await apiSend("/api/admin/restaurant-inquiries", "PATCH", { id, ...patch });
      queryClient.invalidateQueries({ queryKey: ["admin-restaurant-inquiries"] });
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
          <h1 className="font-display text-2xl text-navy-900">Restaurant</h1>
          <p className="text-sm text-muted-foreground">Menu content and table reservation inquiries.</p>
        </div>
        {tab === "menu" && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setCatForm({ name: "", description: "", sortOrder: 0, active: true }); setEditCatId(null); setCatDialog("new"); }}>
              <Plus className="mr-1.5 h-4 w-4" /> New Category
            </Button>
            <Button onClick={() => openNewItem()} className="bg-gold-500 text-navy-950 hover:bg-gold-400">
              <Plus className="mr-1.5 h-4 w-4" /> New Item
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {(["menu", "inquiries"] as const).map((t) => (
          <button
            key={t}
            onClick={() => navigate(t === "inquiries" ? "/admin/restaurant?tab=inquiries" : "/admin/restaurant")}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              tab === t ? "bg-navy-900 text-ivory" : "border border-border bg-card text-muted-foreground hover:text-navy-900"
            }`}
          >
            {t === "menu" ? "Menu" : `Table Inquiries${inquiriesQuery.data ? ` (${inquiriesQuery.data.inquiries.filter((i) => i.status === "NEW").length} new)` : ""}`}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------- MENU */}
      {tab === "menu" && (
        <div className="space-y-6">
          {menuQuery.isLoading && (
            <div className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-gold-500" /></div>
          )}
          {menuQuery.data?.categories.map((cat) => (
            <div key={cat.id} className="border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <h2 className="font-display text-lg text-navy-900">{cat.name}</h2>
                  {cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {!cat.active && <Badge variant="outline" className="bg-slate-100 text-slate-600">Hidden</Badge>}
                  <button
                    onClick={() => { setCatForm({ name: cat.name, description: cat.description, sortOrder: cat.sortOrder, active: cat.active }); setEditCatId(cat.id); setCatDialog("edit"); }}
                    className="flex h-8 w-8 items-center justify-center border border-border text-muted-foreground hover:bg-muted"
                    title="Edit category"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete menu category "${cat.name}"?`)) return;
                      try {
                        await apiSend(`/api/admin/menu-categories/${cat.id}`, "DELETE");
                        invalidate();
                        toast({ title: "Category deleted" });
                      } catch (e) {
                        toast({ title: "Could not delete", description: e instanceof Error ? e.message : "", variant: "destructive" });
                      }
                    }}
                    className="flex h-8 w-8 items-center justify-center border border-red-600/40 text-red-700 hover:bg-red-50"
                    title="Delete category"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="divide-y divide-border/60">
                {cat.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                    {item.image ? (
                       
                      <img src={item.image} alt={item.name} className="h-12 w-12 shrink-0 object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-muted">
                        <UtensilsCrossed className="h-4 w-4 text-gold-600/60" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-medium text-navy-900">
                        {item.name}
                        {item.featured && <Star className="h-3 w-3 fill-gold-500 text-gold-500" />}
                        {!item.available && <Badge variant="outline" className="bg-red-50 text-red-700">Unavailable</Badge>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-gold-700">{formatTZS(item.price)}</p>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        onClick={() => apiSend(`/api/admin/menu-items/${item.id}`, "PATCH", { available: !item.available }).then(invalidate)}
                        className="border border-border px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground hover:bg-muted"
                      >
                        {item.available ? "Mark out" : "Mark in"}
                      </button>
                      <button
                        onClick={() => { setItemForm({ categoryId: item.categoryId, name: item.name, description: item.description, price: item.price, image: item.image, available: item.available, featured: item.featured, sortOrder: item.sortOrder }); setEditItemId(item.id); setItemDialog("edit"); }}
                        className="flex h-8 w-8 items-center justify-center border border-border text-muted-foreground hover:bg-muted"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete menu item "${item.name}"?`)) return;
                          try {
                            await apiSend(`/api/admin/menu-items/${item.id}`, "DELETE");
                            invalidate();
                            toast({ title: "Item deleted" });
                          } catch (e) {
                            toast({ title: "Could not delete", description: e instanceof Error ? e.message : "", variant: "destructive" });
                          }
                        }}
                        className="flex h-8 w-8 items-center justify-center border border-red-600/40 text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {cat.items.length === 0 && (
                  <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                    No items in this category yet.
                    <button onClick={() => openNewItem(cat.id)} className="ml-2 text-gold-700 underline">
                      Add the first one
                    </button>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------- INQUIRIES */}
      {tab === "inquiries" && (
        <div className="space-y-3">
          {inquiriesQuery.isLoading && (
            <div className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-gold-500" /></div>
          )}
          {inquiriesQuery.data?.inquiries.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">No table reservation requests yet.</p>
          )}
          {inquiriesQuery.data?.inquiries.map((inq) => (
            <div key={inq.id} className="border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-navy-900">
                    {inq.name} · table for {inq.partySize}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {inq.date} at {inq.time} · {inq.phone}
                    {inq.email ? ` · ${inq.email}` : ""}
                  </p>
                  {inq.note && <p className="mt-1 text-xs italic text-muted-foreground">“{inq.note}”</p>}
                  <p className="mt-1 text-[10px] text-muted-foreground">Submitted {formatTimestamp(inq.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"
                    style={{ background: STATUS_COLORS[inq.status] ?? "#8a8f96" }}
                  >
                    {inq.status}
                  </span>
                  <Select value={inq.status} onValueChange={(v) => updateInquiry(inq.id, { status: v })}>
                    <SelectTrigger className="h-8 w-[140px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INQUIRY_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <a
                    href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${inq.name}, regarding your table request at Hillstar Restaurant on ${inq.date} at ${inq.time}...`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center border border-gold-600/40 text-gold-700 hover:bg-accent"
                    title="WhatsApp guest"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 14.2c-.2.6-1.2 1.2-1.7 1.2-.4 0-1 .1-3.3-.9-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.4.7-.4h.5c.2 0 .4 0 .6.4l.9 2.1c.1.2.1.4 0 .6l-.4.6c-.1.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.7-.1l.9-1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.4s0 1-.2 1.6z"/></svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category dialog */}
      <Dialog open={catDialog !== "closed"} onOpenChange={(open) => !open && setCatDialog("closed")}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{catDialog === "new" ? "New menu category" : `Edit ${catForm.name}`}</DialogTitle>
            <DialogDescription>Categories structure the public menu (e.g. Breakfast, Mains).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Name *</Label>
              <Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={2} value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} className="mt-1" />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={catForm.active} onCheckedChange={(v) => setCatForm({ ...catForm, active: v })} />
                Active (public)
              </label>
              <div>
                <Label>Sort order</Label>
                <Input type="number" min={0} value={catForm.sortOrder} onChange={(e) => setCatForm({ ...catForm, sortOrder: Number(e.target.value) || 0 })} className="mt-1 w-24" />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCatDialog("closed")}>Cancel</Button>
            <Button onClick={saveCat} disabled={!catForm.name} className="bg-navy-900 text-ivory hover:bg-navy-800">
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Item dialog */}
      <Dialog open={itemDialog !== "closed"} onOpenChange={(open) => !open && setItemDialog("closed")}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto scrollbar-elegant">
          <DialogHeader>
            <DialogTitle>{itemDialog === "new" ? "New menu item" : `Edit ${itemForm.name}`}</DialogTitle>
            <DialogDescription>Dishes shown on the public restaurant page.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Category *</Label>
              <Select value={itemForm.categoryId} onValueChange={(v) => setItemForm({ ...itemForm, categoryId: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {menuQuery.data?.categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Name *</Label>
              <Input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={2} value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Price (TZS) *</Label>
              <Input
                inputMode="numeric"
                value={itemForm.price || ""}
                onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value.replace(/[^0-9]/g, "")) || 0 })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Image</Label>
              <div className="mt-1.5 flex items-center gap-3">
                {itemForm.image ? (
                  <div className="relative h-14 w-14 overflow-hidden bg-sand">
                    { }
                    <img src={itemForm.image} alt="Dish" className="h-full w-full object-cover" />
                    <button
                      onClick={() => setItemForm({ ...itemForm, image: "" })}
                      className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center bg-navy-950/80 text-white"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="flex h-14 w-14 cursor-pointer flex-col items-center justify-center border border-dashed border-border bg-muted/40 text-muted-foreground hover:border-gold-500">
                    <ImagePlus className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const url = await uploadImage(file);
                          setItemForm((f) => ({ ...f, image: url }));
                        } catch (err) {
                          toast({ title: "Upload failed", description: err instanceof Error ? err.message : "", variant: "destructive" });
                        }
                      }}
                    />
                  </label>
                )}
                <Input value={itemForm.image} onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })} placeholder="…or paste path" className="flex-1" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={itemForm.available} onCheckedChange={(v) => setItemForm({ ...itemForm, available: v })} />
                Available
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={itemForm.featured} onCheckedChange={(v) => setItemForm({ ...itemForm, featured: v })} />
                Featured
              </label>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setItemDialog("closed")}>Cancel</Button>
            <Button onClick={saveItem} disabled={!itemForm.name || !itemForm.categoryId || itemForm.price <= 0} className="bg-navy-900 text-ivory hover:bg-navy-800">
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
