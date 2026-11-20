"use client";

import { useState } from "react";
import { apiSend } from "@/lib/api-client";
import { Loader2, Lock, UserRound, CircleAlert, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminInfo {
  username: string;
  name: string;
  role: string;
}

export function AdminLogin({ onLogin }: { onLogin: (admin: AdminInfo) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiSend<{ username: string; name: string; role: string }>("/api/admin/auth/login", "POST", {
        username,
        password,
      });
      onLogin(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: "url(/images/hero-lobby.jpg)" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-950/95 to-navy-900/90" aria-hidden="true" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center border border-gold-500/70 rotate-45">
            <svg viewBox="0 0 24 24" className="h-6 w-6 -rotate-45 fill-gold-500" aria-hidden="true">
              <path d="M12 1l2.6 6.6L22 9.2l-5.4 4.6L18.5 21 12 17.3 5.5 21l1.9-7.2L2 9.2l7.4-1.6L12 1z" />
            </svg>
          </span>
          <h1 className="mt-6 font-display text-2xl tracking-[0.22em] text-ivory">HILLSTAR</h1>
          <p className="mt-2 text-[10px] uppercase tracking-brand text-gold-400">Hotel Management Dashboard</p>
        </div>

        <form onSubmit={submit} className="border border-ivory/15 bg-navy-900/80 backdrop-blur-md p-8 shadow-2xl">
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-user" className="text-ivory/80">
                Username
              </Label>
              <div className="relative mt-1.5">
                <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/40" />
                <Input
                  id="admin-user"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9 bg-navy-950/60 border-ivory/20 text-ivory placeholder:text-ivory/30 focus-visible:ring-gold-500"
                  placeholder="Enter username"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="admin-pass" className="text-ivory/80">
                Password
              </Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/40" />
                <Input
                  id="admin-pass"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-navy-950/60 border-ivory/20 text-ivory placeholder:text-ivory/30 focus-visible:ring-gold-500"
                  placeholder="Enter password"
                />
              </div>
            </div>

            {error && (
              <p className="flex items-center gap-2 text-xs text-red-300 bg-red-500/10 border border-red-400/30 px-3 py-2">
                <CircleAlert className="h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gold-500 py-3 text-sm font-semibold uppercase tracking-wider text-navy-950 hover:bg-gold-400 transition-colors disabled:opacity-60"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </form>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-[11px] text-ivory/40">
          <Star className="h-3 w-3 fill-gold-500/60 text-gold-500/60" />
          Authorised staff only · All actions are logged
        </p>
      </div>
    </div>
  );
}
