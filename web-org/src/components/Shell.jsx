import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

  return (
    <div className="min-h-full flex flex-col md:flex-row bg-slate-100">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-primary text-white shadow-lg transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-white/10">
          <p className="text-xs uppercase tracking-wider text-blue-200">
            MedSwift
          </p>
          <p className="text-lg font-semibold">Organization</p>
          {profile?.name && (
            <p className="text-sm text-blue-100 mt-1 truncate">{profile.name}</p>
          )}
        </div>
        <nav className="p-4 flex flex-col gap-1">
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
          <button
            type="button"
            onClick={() => logout()}
            className="mt-4 text-left rounded-lg px-3 py-2 text-sm font-medium bg-emergency/90 hover:bg-emergency"
          >
            Sign out
          </button>
        </nav>
      </aside>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-h-screen md:min-h-0">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-white border-b border-slate-200 px-4 py-3 md:hidden">
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            onClick={() => setOpen(true)}
          >
            Menu
          </button>
          <span className="font-semibold text-primary truncate">MedSwift</span>
          <span className="w-14" />
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
