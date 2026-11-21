"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiSend, uploadImage } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import type { HotelSettings } from "@/lib/settings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, ImagePlus, X, Trash2, Plus } from "lucide-react";

type Tab = "content" | "gallery" | "amenities";

interface GalleryRow {
  id: string;
  url: string;
  caption: string;
  category: string;
  sortOrder: number;
  active: boolean;
}

interface AmenityRow {
  id: string;
  name: string;
  description: string;
  icon: string;
  sortOrder: number;
  active: boolean;
}

function SectionCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="border border-border bg-card p-5">
      <h3 className="font-display text-lg text-navy-900">{title}</h3>
      {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
  full,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <Label>{label}</Label>
      {textarea ? (
        <Textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5" />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5" />
      )}
    </div>
  );
}

export function AdminSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("content");
  const [form, setForm] = useState<HotelSettings | null>(null);
  const [saving, setSaving] = useState(false);

  const settingsQuery = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => apiGet<{ settings: HotelSettings }>("/api/admin/settings"),
  });

  useEffect(() => {
    if (settingsQuery.data?.settings) setForm(settingsQuery.data.settings);
  }, [settingsQuery.data]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    queryClient.invalidateQueries({ queryKey: ["public-content"] });
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await apiSend("/api/admin/settings", "PUT", form);
      invalidate();
      toast({ title: "Settings saved", description: "The website updates immediately." });
    } catch (e) {
      toast({ title: "Save failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const set = (path: string, value: unknown) => {
    setForm((f) => {
      if (!f) return f;
      const clone = JSON.parse(JSON.stringify(f)) as HotelSettings;
      const keys = path.split(".");
      let obj = clone as unknown as Record<string, unknown>;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]] as Record<string, unknown>;
      obj[keys[keys.length - 1]] = value;
      return clone;
    });
  };

  // Gallery + amenities
  const galleryQuery = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: () => apiGet<{ images: GalleryRow[] }>("/api/admin/gallery"),
    enabled: tab === "gallery",
  });
  const amenitiesQuery = useQuery({
    queryKey: ["admin-amenities"],
    queryFn: () => apiGet<{ amenities: AmenityRow[] }>("/api/admin/amenities"),
    enabled: tab === "amenities",
  });

  const [newImage, setNewImage] = useState({ url: "", caption: "", category: "EXPERIENCES" });

  if (tab === "content" && (!form || settingsQuery.isLoading)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-navy-900">Settings</h1>
          <p className="text-sm text-muted-foreground">All website content, imagery and facilities are editable here.</p>
        </div>
        {tab === "content" && (
          <Button onClick={save} disabled={saving} className="bg-gold-500 text-navy-950 hover:bg-gold-400">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save all content
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        {(["content", "gallery", "amenities"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider capitalize transition-colors ${
              tab === t ? "bg-navy-900 text-ivory" : "border border-border bg-card text-muted-foreground hover:text-navy-900"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------- CONTENT */}
      {tab === "content" && form && (
        <div className="space-y-4">
          <SectionCard title="Hotel & Contact" desc="Business information shown across the website and WhatsApp links.">
            <Field label="Hotel name" value={form.hotel.name} onChange={(v) => set("hotel.name", v)} />
            <Field label="Tagline" value={form.hotel.tagline} onChange={(v) => set("hotel.tagline", v)} />
            <Field label="Address" value={form.hotel.address} onChange={(v) => set("hotel.address", v)} />
            <Field label="Email" value={form.hotel.email} onChange={(v) => set("hotel.email", v)} />
            <Field label="WhatsApp number (digits only, e.g. 255725221069)" value={form.hotel.whatsapp} onChange={(v) => set("hotel.whatsapp", v)} />
            <Field label="Phone display" value={form.hotel.whatsappDisplay} onChange={(v) => set("hotel.whatsappDisplay", v)} />
            <Field label="Google Maps link" value={form.hotel.mapUrl} onChange={(v) => set("hotel.mapUrl", v)} full />
          </SectionCard>

          <SectionCard title="Homepage Hero" desc="Headline and hero carousel images (comma-separated paths).">
            <Field label="Headline" value={form.hero.headline} onChange={(v) => set("hero.headline", v)} full />
            <Field label="Sub-headline" value={form.hero.subheadline} onChange={(v) => set("hero.subheadline", v)} textarea full />
            <Field label="Images (comma-separated)" value={form.hero.images.join(", ")} onChange={(v) => set("hero.images", v.split(",").map((s) => s.trim()).filter(Boolean))} full />
            <Field label="Primary CTA label" value={form.hero.primaryCta} onChange={(v) => set("hero.primaryCta", v)} />
            <Field label="Secondary CTA label" value={form.hero.secondaryCta} onChange={(v) => set("hero.secondaryCta", v)} />
          </SectionCard>

          <SectionCard title="Welcome Section" desc="The homepage welcome story.">
            <Field label="Title" value={form.welcome.title} onChange={(v) => set("welcome.title", v)} />
            <Field label="Images (comma-separated)" value={form.welcome.images.join(", ")} onChange={(v) => set("welcome.images", v.split(",").map((s) => s.trim()).filter(Boolean))} />
            <Field
              label="Paragraphs (one per line)"
              value={form.welcome.paragraphs.join("\n")}
              onChange={(v) => set("welcome.paragraphs", v)}
              textarea
              full
            />
          </SectionCard>

          <SectionCard title="Restaurant Content" desc="Public dining introduction and opening hours.">
            <Field label="Title" value={form.restaurant.title} onChange={(v) => set("restaurant.title", v)} />
            <Field label="Reservation note" value={form.restaurant.reservationNote} onChange={(v) => set("restaurant.reservationNote", v)} />
            <Field label="Introduction" value={form.restaurant.intro} onChange={(v) => set("restaurant.intro", v)} textarea full />
            <div className="sm:col-span-2">
              <Label>Opening hours (one per line: label | time)</Label>
              <Textarea
                rows={3}
                value={form.restaurant.hours.map((h) => `${h.label} | ${h.time}`).join("\n")}
                onChange={(e) =>
                  set(
                    "restaurant.hours",
                    e.target.value
                      .split("\n")
                      .map((line) => {
                        const [label, time] = line.split("|").map((s) => s.trim());
                        return { label: label || "", time: time || "" };
                      })
                      .filter((h) => h.label)
                  )
                }
                className="mt-1.5"
              />
            </div>
          </SectionCard>

          <SectionCard title="Meetings Content" desc="Public meetings introduction.">
            <Field label="Title" value={form.meetings.title} onChange={(v) => set("meetings.title", v)} />
            <Field label="Note" value={form.meetings.note} onChange={(v) => set("meetings.note", v)} />
            <Field label="Introduction" value={form.meetings.intro} onChange={(v) => set("meetings.intro", v)} textarea full />
          </SectionCard>

          <SectionCard title="About Page" desc="Hotel story, mission, vision and values.">
            <Field label="Title" value={form.about.title} onChange={(v) => set("about.title", v)} />
            <Field label="Mission" value={form.about.mission} onChange={(v) => set("about.mission", v)} />
            <Field label="Vision" value={form.about.vision} onChange={(v) => set("about.vision", v)} />
            <Field
              label="Story (one paragraph per line)"
              value={form.about.story.join("\n")}
              onChange={(v) => set("about.story", v)}
              textarea
              full
            />
            <div className="sm:col-span-2">
              <Label>Values (one per line: title | text)</Label>
              <Textarea
                rows={4}
                value={form.about.values.map((v) => `${v.title} | ${v.text}`).join("\n")}
                onChange={(e) =>
                  set(
                    "about.values",
                    e.target.value
                      .split("\n")
                      .map((line) => {
                        const [title, text] = line.split("|").map((s) => s.trim());
                        return { title: title || "", text: text || "" };
                      })
                      .filter((v) => v.title)
                  )
                }
                className="mt-1.5"
              />
            </div>
          </SectionCard>

          <SectionCard title="Booking Rules" desc="Reservation engine behaviour and policies shown to guests.">
            <Field label="Pending request expiration (minutes)" value={String(form.booking.pendingExpirationMinutes)} onChange={(v) => set("booking.pendingExpirationMinutes", v.replace(/[^0-9]/g, ""))} />
            <Field label="Check-in time" value={form.booking.checkInTime} onChange={(v) => set("booking.checkInTime", v)} />
            <Field label="Check-out time" value={form.booking.checkOutTime} onChange={(v) => set("booking.checkOutTime", v)} />
            <Field label="Children policy" value={form.booking.childrenPolicy} onChange={(v) => set("booking.childrenPolicy", v)} textarea full />
            <Field label="Cancellation note" value={form.booking.cancellationNote} onChange={(v) => set("booking.cancellationNote", v)} textarea full />
            <Field label="Request-to-book note" value={form.booking.requestNote} onChange={(v) => set("booking.requestNote", v)} textarea full />
          </SectionCard>

          <SectionCard title="Footer" desc="Footer note.">
            <Field label="Footer note" value={form.footer.note} onChange={(v) => set("footer.note", v)} full />
          </SectionCard>
        </div>
      )}

      {/* ------------------------------------------------------------- GALLERY */}
      {tab === "gallery" && (
        <div className="space-y-4">
          <div className="border border-border bg-card p-5">
            <h3 className="font-display text-lg text-navy-900">Add gallery image</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <Label>Image</Label>
                <div className="mt-1.5 flex items-center gap-2">
                  {newImage.url ? (
                    <div className="relative h-12 w-20 shrink-0 overflow-hidden bg-sand">
                      { }
                      <img src={newImage.url} alt="Preview" className="h-full w-full object-cover" />
                      <button
                        onClick={() => setNewImage({ ...newImage, url: "" })}
                        className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center bg-navy-950/80 text-white"
                        aria-label="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex h-12 w-20 shrink-0 cursor-pointer flex-col items-center justify-center border border-dashed border-border bg-muted/40 text-muted-foreground hover:border-gold-500">
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
                            setNewImage((n) => ({ ...n, url }));
                          } catch (err) {
                            toast({ title: "Upload failed", description: err instanceof Error ? err.message : "", variant: "destructive" });
                          }
                        }}
                      />
                    </label>
                  )}
                  <Input value={newImage.url} onChange={(e) => setNewImage({ ...newImage, url: e.target.value })} placeholder="…or paste path" className="flex-1" />
                </div>
              </div>
              <div>
                <Label>Caption</Label>
                <Input value={newImage.caption} onChange={(e) => setNewImage({ ...newImage, caption: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label>Category</Label>
                <select
                  value={newImage.category}
                  onChange={(e) => setNewImage({ ...newImage, category: e.target.value })}
                  className="mt-1.5 h-9 w-full border border-input bg-transparent px-2 text-sm"
                  aria-label="Gallery category"
                >
                  {["ROOMS", "RESTAURANT", "MEETINGS", "EXTERIOR", "COMMON", "EXPERIENCES"].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-4">
                <Button
                  className="bg-navy-900 text-ivory hover:bg-navy-800"
                  disabled={!newImage.url}
                  onClick={async () => {
                    try {
                      await apiSend("/api/admin/gallery", "POST", { ...newImage, sortOrder: 99, active: true });
                      setNewImage({ url: "", caption: "", category: "EXPERIENCES" });
                      queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
                      invalidate();
                      toast({ title: "Image added to gallery" });
                    } catch (e) {
                      toast({ title: "Failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
                    }
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add to gallery
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {galleryQuery.data?.images.map((g) => (
              <div key={g.id} className="border border-border bg-card overflow-hidden">
                <div className="relative aspect-[4/3] bg-sand">
                  { }
                  <img src={g.url} alt={g.caption} loading="lazy" className={`h-full w-full object-cover ${!g.active ? "opacity-40" : ""}`} />
                  {!g.active && <Badge className="absolute top-2 left-2 bg-slate-700 text-white">Hidden</Badge>}
                </div>
                <div className="p-3">
                  <p className="truncate text-xs font-medium text-navy-900">{g.caption || "—"}</p>
                  <p className="text-[10px] text-muted-foreground">{g.category}</p>
                  <div className="mt-2 flex gap-1.5">
                    <button
                      onClick={() => apiSend(`/api/admin/gallery/${g.id}`, "PATCH", { active: !g.active }).then(() => { queryClient.invalidateQueries({ queryKey: ["admin-gallery"] }); invalidate(); })}
                      className="flex-1 border border-border px-2 py-1 text-[10px] uppercase text-muted-foreground hover:bg-muted"
                    >
                      {g.active ? "Hide" : "Show"}
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("Remove this image from the gallery?")) return;
                        try {
                          await apiSend(`/api/admin/gallery/${g.id}`, "DELETE");
                          queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
                          invalidate();
                          toast({ title: "Image removed" });
                        } catch (e) {
                          toast({ title: "Failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
                        }
                      }}
                      className="flex h-7 w-7 items-center justify-center border border-red-600/40 text-red-700 hover:bg-red-50"
                      aria-label="Delete image"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- AMENITIES */}
      {tab === "amenities" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Facilities shown in the homepage amenities section. Only verified hotel facilities should be listed.
          </p>
          <div className="border border-border bg-card divide-y divide-border/60">
            {amenitiesQuery.isLoading && (
              <div className="py-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-gold-500" /></div>
            )}
            {amenitiesQuery.data?.amenities.map((a) => (
              <div key={a.id} className="flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-navy-900">
                    {a.name} {!a.active && <Badge variant="outline" className="ml-2 bg-slate-100 text-slate-600">Hidden</Badge>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{a.description}</p>
                </div>
                <p className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">icon: {a.icon}</p>
                <button
                  onClick={() => apiSend(`/api/admin/amenities/${a.id}`, "PATCH", { active: !a.active }).then(() => { queryClient.invalidateQueries({ queryKey: ["admin-amenities"] }); invalidate(); })}
                  className="border border-border px-2 py-1 text-[10px] uppercase text-muted-foreground hover:bg-muted"
                >
                  {a.active ? "Hide" : "Show"}
                </button>
                <button
                  onClick={async () => {
                    if (!confirm(`Remove amenity "${a.name}"?`)) return;
                    try {
                      await apiSend(`/api/admin/amenities/${a.id}`, "DELETE");
                      queryClient.invalidateQueries({ queryKey: ["admin-amenities"] });
                      invalidate();
                      toast({ title: "Amenity removed" });
                    } catch (e) {
                      toast({ title: "Failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
                    }
                  }}
                  className="flex h-8 w-8 items-center justify-center border border-red-600/40 text-red-700 hover:bg-red-50"
                  aria-label={`Delete ${a.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <NewAmenityForm onAdded={() => { queryClient.invalidateQueries({ queryKey: ["admin-amenities"] }); invalidate(); }} />
        </div>
      )}
    </div>
  );
}

function NewAmenityForm({ onAdded }: { onAdded: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Check");

  return (
    <div className="border border-border bg-card p-5">
      <h3 className="font-display text-lg text-navy-900">Add amenity</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" placeholder="e.g. Airport Shuttle" />
        </div>
        <div>
          <Label>Description</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label>Lucide icon name</Label>
          <Input value={icon} onChange={(e) => setIcon(e.target.value)} className="mt-1.5" placeholder="Wifi, CarFront, Check…" />
        </div>
        <div className="sm:col-span-3">
          <Button
            className="bg-navy-900 text-ivory hover:bg-navy-800"
            disabled={!name}
            onClick={async () => {
              try {
                await apiSend("/api/admin/amenities", "POST", { name, description, icon, sortOrder: 99, active: true });
                setName("");
                setDescription("");
                setIcon("Check");
                onAdded();
                toast({ title: "Amenity added" });
              } catch (e) {
                toast({ title: "Failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
              }
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add amenity
          </Button>
        </div>
      </div>
    </div>
  );
}
