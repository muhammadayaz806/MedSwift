import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { trackVisit } from "../pages/NotFound";

const links = [
  { to: "/", label: "Overview" },
  { to: "/drivers", label: "Drivers" },
  { to: "/ambulances", label: "Ambulances" },
  { to: "/history", label: "History" },
  { to: "/reports", label: "False reports" },
];

export default function Shell() {
  const { logout, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    trackVisit(location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-full flex flex-col md:flex-row bg-brand-bg">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 transform flex-col bg-brand-text text-white shadow-lg transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-white/10">
          <p className="text-xs uppercase tracking-wider text-brand-soft">
            MedSwift
          </p>
          <p className="text-lg font-semibold">Organization</p>
          {profile?.name && (
            <p className="text-sm text-brand-muted mt-1 truncate">
              {profile.name}
            </p>
          )}
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? "bg-white/20" : "hover:bg-white/10"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={() => logout()}
            className="w-full text-left rounded-lg px-3 py-2 text-sm font-medium bg-brand-emergency hover:bg-brand-red transition"
          >
            Sign out
          </button>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-brand-card border-b border-brand-border px-4 py-3 md:hidden">
          <button
            type="button"
            className="rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-text"
            onClick={() => setOpen(true)}
          >
            Menu
          </button>
          <span className="font-semibold text-brand-accent truncate">
            MedSwift
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
