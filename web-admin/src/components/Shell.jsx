import { useState, useEffect, useCallback } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

const BASE_LINKS = [
  { to: "/", label: "Organizations" },
  { to: "/users", label: "Users" },
  { to: "/drivers", label: "Drivers" },
  { to: "/emergencies", label: "Emergencies" },
  { to: "/reports", label: "Reports" },
  { to: "/unsuspend-requests", label: "Unsuspend Requests", badgeKey: "unsuspend" },
];

export default function Shell() {
  const { logout, profile, getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [pendingUnsuspend, setPendingUnsuspend] = useState(0);

  const fetchPendingCount = useCallback(async () => {
    try {
      const token = await getToken();
      const data = await api("/admin/unsuspend-requests", { method: "GET" }, token);
      const count = (data.requests || []).filter((r) => r.status === "pending").length;
      setPendingUnsuspend(count);
    } catch {
      // silently fail — badge is non-critical
    }
  }, [getToken]);

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 60_000); // refresh every minute
    return () => clearInterval(interval);
  }, [fetchPendingCount]);

  const badges = { unsuspend: pendingUnsuspend };

  return (
    <div className="min-h-full flex flex-col md:flex-row bg-brand-bg">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 transform flex-col bg-brand-surface border-r border-brand-border transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-brand-border">
          <p className="text-xs uppercase tracking-wider text-brand-sub">
            MedSwift
          </p>
          <p className="text-lg font-semibold text-brand-ink">Super Admin</p>
          {profile?.name && (
            <p className="text-sm text-brand-sub mt-1 truncate">
              {profile.name}
            </p>
          )}
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-1">
          {BASE_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition flex items-center justify-between ${
                  isActive
                    ? "bg-brand-emergency text-white"
                    : "text-brand-text hover:bg-brand-muted"
                }`
              }
            >
              <span>{l.label}</span>
              {l.badgeKey && badges[l.badgeKey] > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-white">
                  {badges[l.badgeKey]}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-brand-border p-4">
          <button
            type="button"
            onClick={() => logout()}
            className="w-full text-left rounded-lg px-3 py-2 text-sm font-medium bg-brand-emergency hover:bg-brand-red text-white transition"
          >
            Sign out
          </button>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="sticky top-0 z-20 flex md:hidden items-center justify-between gap-3 bg-brand-surface border-b border-brand-border px-4 py-3">
          <button
            type="button"
            className="rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-text"
            onClick={() => setOpen(true)}
          >
            Menu
          </button>
          <span className="font-semibold text-brand-ink truncate">
            MedSwift Admin
          </span>
          <span className="w-14" />
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
