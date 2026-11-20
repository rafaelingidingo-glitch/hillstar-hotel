"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiSend } from "@/lib/api-client";
import { navigate } from "@/lib/site-hooks";
import {
  LayoutDashboard,
  BookUser,
  BedDouble,
  CalendarDays,
  UtensilsCrossed,
  Presentation,
  FileBarChart,
  Settings2,
  LogOut,
  Bell,
  ExternalLink,
  Star,
  Loader2,
} from "lucide-react";

interface AdminInfo {
  username: string;
  name: string;
  role: string;
}

const NAV = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Reservations", path: "/admin/reservations", icon: BookUser },
  { label: "Rooms", path: "/admin/rooms", icon: BedDouble },
  { label: "Calendar", path: "/admin/calendar", icon: CalendarDays },
  { label: "Restaurant", path: "/admin/restaurant", icon: UtensilsCrossed },
  { label: "Meetings", path: "/admin/meetings", icon: Presentation },
  { label: "Reports", path: "/admin/reports", icon: FileBarChart },
  { label: "Settings", path: "/admin/settings", icon: Settings2 },
];

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}

function useNotifications(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => apiGet<{ notifications: NotificationRow[]; unread: number }>("/api/admin/notifications"),
    refetchInterval: 15000,
    enabled,
  });
}

function NotificationBell() {
  const { data, refetch } = useNotifications(true);
  const [open, setOpen] = useState(false);
  const unread = data?.unread ?? 0;

  const markAll = async () => {
    try {
      await apiSend("/api/admin/notifications", "POST", { all: true });
      refetch();
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center border border-ivory/20 text-ivory/80 hover:bg-ivory/10 transition-colors"
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-navy-950">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 md:w-96 border border-ivory/15 bg-navy-900 shadow-2xl max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-ivory/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gold-400">Notifications</p>
              {unread > 0 && (
                <button onClick={markAll} className="text-[11px] text-ivory/60 hover:text-gold-300">
                  Mark all read
                </button>
              )}
            </div>
            <div className="scrollbar-elegant flex-1 overflow-y-auto">
              {data?.notifications.length === 0 && (
                <p className="px-4 py-8 text-center text-xs text-ivory/40">No notifications yet.</p>
              )}
              {data?.notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setOpen(false);
                    if (n.link) navigate(n.link.replace(/^#/, ""));
                    if (!n.read) apiSend("/api/admin/notifications", "POST", { id: n.id }).then(() => refetch());
                  }}
                  className={`block w-full border-b border-ivory/5 px-4 py-3 text-left transition-colors hover:bg-ivory/5 ${
                    !n.read ? "bg-gold-500/5" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs ${!n.read ? "font-semibold text-ivory" : "text-ivory/70"}`}>{n.title}</p>
                    {!n.read && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-ivory/50">{n.message}</p>
                  <p className="mt-1 text-[10px] text-ivory/30">
                    {new Intl.DateTimeFormat("en-GB", {
                      timeZone: "Africa/Dar_es_Salaam",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(n.createdAt))}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function AdminShell({
  admin,
  route,
  onLogout,
  children,
}: {
  admin: AdminInfo;
  route: { path: string };
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const [mobileNav, setMobileNav] = useState(false);
  const activePath = route.path;

  return (
    <div className="min-h-screen bg-[#f2efe7] flex" style={{ isolation: "isolate" }}>
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-navy-950 lg:flex" aria-label="Admin navigation">
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-3 border-b border-ivory/10 px-5 py-5"
        >
          <span className="flex h-8 w-8 items-center justify-center border border-gold-500/70 rotate-45">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 -rotate-45 fill-gold-500" aria-hidden="true">
              <path d="M12 1l2.6 6.6L22 9.2l-5.4 4.6L18.5 21 12 17.3 5.5 21l1.9-7.2L2 9.2l7.4-1.6L12 1z" />
            </svg>
          </span>
          <span className="text-left leading-none">
            <span className="block font-display text-sm tracking-[0.2em] text-ivory">HILLSTAR</span>
            <span className="mt-1 block text-[8px] tracking-brand text-gold-400 uppercase">Admin Suite</span>
          </span>
        </button>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-elegant">
          {NAV.map((item) => {
            const active = item.exact ? activePath === item.path : activePath.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-gold-500/15 text-gold-300 font-semibold border-l-2 border-gold-500"
                    : "text-ivory/65 hover:bg-ivory/5 hover:text-ivory border-l-2 border-transparent"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-ivory/10 p-4">
          <button
            onClick={() => navigate("/")}
            className="flex w-full items-center gap-2 px-2 py-2 text-xs text-ivory/60 hover:text-gold-300 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View Website
          </button>
          <div className="mt-2 flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center bg-navy-800 text-xs font-semibold text-gold-400">
                {admin.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="leading-tight">
                <p className="text-xs font-medium text-ivory">{admin.name}</p>
                <p className="text-[10px] text-ivory/40">{admin.role}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="text-ivory/50 hover:text-red-300 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between bg-navy-950 px-4 lg:hidden">
        <button
          onClick={() => setMobileNav(!mobileNav)}
          className="flex h-9 w-9 items-center justify-center border border-ivory/20 text-ivory"
          aria-label="Toggle navigation"
        >
          <LayoutDashboard className="h-4 w-4" />
        </button>
        <button onClick={() => navigate("/admin")} className="flex items-center gap-2">
          <Star className="h-4 w-4 fill-gold-500 text-gold-500" />
          <span className="font-display text-sm tracking-[0.2em] text-ivory">HILLSTAR ADMIN</span>
        </button>
        <NotificationBell />
      </header>

      {/* Mobile nav overlay */}
      {mobileNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/80" onClick={() => setMobileNav(false)} />
          <nav className="absolute inset-y-0 left-0 w-64 bg-navy-950 px-3 py-6" aria-label="Admin mobile navigation">
            {NAV.map((item) => {
              const active = item.exact ? activePath === item.path : activePath.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    setMobileNav(false);
                    navigate(item.path);
                  }}
                  className={`flex w-full items-center gap-3 px-3.5 py-3 text-sm ${
                    active ? "bg-gold-500/15 text-gold-300 font-semibold" : "text-ivory/65"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
            <div className="mt-6 border-t border-ivory/10 pt-4">
              <button
                onClick={() => navigate("/")}
                className="flex w-full items-center gap-2 px-3.5 py-2 text-xs text-ivory/60"
              >
                <ExternalLink className="h-3.5 w-3.5" /> View Website
              </button>
              <button onClick={onLogout} className="flex w-full items-center gap-2 px-3.5 py-2 text-xs text-red-300">
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-60">
        <div className="hidden h-14 items-center justify-end gap-4 bg-navy-950 px-6 lg:flex">
          <NotificationBell />
          <div className="flex items-center gap-3 border-l border-ivory/15 pl-4">
            <span className="flex h-8 w-8 items-center justify-center bg-navy-800 text-xs font-semibold text-gold-400">
              {admin.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="leading-tight">
              <p className="text-xs font-medium text-ivory">{admin.name}</p>
              <p className="text-[10px] text-ivory/40">{admin.role}</p>
            </div>
          </div>
        </div>
        <main className="flex-1 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-20 lg:px-8 lg:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
