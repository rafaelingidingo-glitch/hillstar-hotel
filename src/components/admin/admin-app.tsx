"use client";

import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/api-client";
import { AdminLogin } from "./admin-login";
import { AdminShell } from "./admin-shell";
import { AdminDashboardPage } from "./pages/admin-dashboard-page";
import { AdminReservationsPage } from "./pages/admin-reservations-page";
import { AdminRoomsPage } from "./pages/admin-rooms-page";
import { AdminCalendarPage } from "./pages/admin-calendar-page";
import { AdminRestaurantPage } from "./pages/admin-restaurant-page";
import { AdminMeetingsPage } from "./pages/admin-meetings-page";
import { AdminReportsPage } from "./pages/admin-reports-page";
import { AdminSettingsPage } from "./pages/admin-settings-page";
import type { HashRoute } from "@/lib/site-hooks";

interface AdminInfo {
  username: string;
  name: string;
  role: string;
}

export function AdminApp({ route }: { route: HashRoute }) {
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ admin: AdminInfo }>("/api/admin/auth/me")
      .then((res) => {
        if (!cancelled) setAdmin(res.admin);
      })
      .catch(() => {
        if (!cancelled) setAdmin(null);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = async () => {
    try {
      await apiSend("/api/admin/auth/logout", "POST");
    } catch {
      // ignore
    }
    setAdmin(null);
    window.location.hash = "#/admin";
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-9 w-9 rounded-full border-2 border-gold-500/30 border-t-gold-500 animate-spin" />
          <p className="text-xs uppercase tracking-brand text-ivory/60">Hillstar Admin</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return <AdminLogin onLogin={setAdmin} />;
  }

  const sub = route.path.replace("/admin", "") || "/";
  const page = (() => {
    if (sub === "/" || sub === "") return <AdminDashboardPage />;
    if (sub.startsWith("/reservations")) return <AdminReservationsPage route={route} />;
    if (sub.startsWith("/rooms")) return <AdminRoomsPage />;
    if (sub.startsWith("/calendar")) return <AdminCalendarPage />;
    if (sub.startsWith("/restaurant")) return <AdminRestaurantPage route={route} />;
    if (sub.startsWith("/meetings")) return <AdminMeetingsPage />;
    if (sub.startsWith("/reports")) return <AdminReportsPage />;
    if (sub.startsWith("/settings")) return <AdminSettingsPage />;
    return <AdminDashboardPage />;
  })();

  return (
    <AdminShell admin={admin} route={route} onLogout={logout}>
      {page}
    </AdminShell>
  );
}
