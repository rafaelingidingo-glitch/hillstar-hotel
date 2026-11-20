"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { usePageMeta } from "@/lib/site-hooks";
import { formatTZS, formatDateShort, formatTimestamp, todayStr, addDaysStr } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Printer, FileBarChart } from "lucide-react";

const REPORT_TYPES = [
  { key: "bookings", label: "Bookings", desc: "All bookings with stay dates in range" },
  { key: "occupancy", label: "Occupancy", desc: "Daily occupancy rate per room category" },
  { key: "revenue", label: "Revenue", desc: "Recorded payments in range" },
  { key: "cancellations", label: "Cancellations", desc: "Cancelled, rejected, expired and no-show bookings" },
  { key: "guests", label: "Guests", desc: "Guest summary from confirmed stays in range" },
];

export function AdminReportsPage() {
  usePageMeta("Reports — Hillstar Admin", undefined, undefined);
  const today = todayStr();
  const [type, setType] = useState("bookings");
  const [from, setFrom] = useState(addDaysStr(today, -30));
  const [to, setTo] = useState(today);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-report", type, from, to],
    queryFn: () =>
      apiGet<{ rows: Record<string, unknown>[]; summary: Record<string, number> }>(
        `/api/admin/reports?type=${type}&from=${from}&to=${to}`
      ),
  });

  const columns = data?.rows && data.rows.length > 0 ? Object.keys(data.rows[0]) : [];

  const fmtCell = (col: string, value: unknown): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "number" && /TZS/i.test(col)) return formatTZS(value);
    return String(value);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-navy-900">Reports</h1>
          <p className="text-sm text-muted-foreground">Business reports based on actual recorded data.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="border-navy-900/30"
          >
            <Printer className="mr-1.5 h-4 w-4" /> Print / PDF
          </Button>
          <a
            href={`/api/admin/reports?type=${type}&from=${from}&to=${to}&format=csv`}
            download
            className="inline-flex h-9 items-center gap-1.5 bg-navy-900 px-3 text-sm font-medium text-ivory hover:bg-navy-800"
          >
            <Download className="h-4 w-4" /> Export CSV
          </a>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4 border border-border bg-card p-4">
        <div className="min-w-[140px]">
          <Label>Report type</Label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1.5 h-9 w-full border border-input bg-transparent px-2 text-sm"
            aria-label="Report type"
          >
            {REPORT_TYPES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>From</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1.5 w-[150px]" />
        </div>
        <div>
          <Label>To</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1.5 w-[150px]" />
        </div>
        <p className="text-xs text-muted-foreground">
          {REPORT_TYPES.find((t) => t.key === type)?.desc}
        </p>
      </div>

      {/* Summary */}
      {data?.summary && Object.keys(data.summary).length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Object.entries(data.summary).map(([k, v]) => (
            <div key={k} className="border border-border bg-card p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {k.replace(/([A-Z])/g, " $1").replace(/TZS/, "(TZS)")}
              </p>
              <p className="mt-1.5 font-display text-xl text-navy-900">
                {typeof v === "number" && /Revenue|Value/i.test(k) ? formatTZS(v) : v}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="border border-border bg-card">
        <div className="scrollbar-elegant max-h-[62vh] overflow-auto">
          {isLoading ? (
            <div className="py-14 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-gold-500" />
            </div>
          ) : !data || data.rows.length === 0 ? (
            <div className="py-14 text-center">
              <FileBarChart className="mx-auto h-8 w-8 text-gold-600/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                No data for this report and date range.
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead className="sticky top-0 bg-muted/60 backdrop-blur">
                <tr>
                  {columns.map((c) => (
                    <th key={c} className="border-b border-border px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {c.replace(/([A-Z])/g, " $1").trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                    {columns.map((c) => (
                      <td key={c} className="px-3 py-2 whitespace-nowrap">
                        {fmtCell(c, row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {data && (
          <p className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
            {data.rows.length} rows · {from} → {to} · Africa/Dar_es_Salaam
          </p>
        )}
      </div>
    </div>
  );
}
