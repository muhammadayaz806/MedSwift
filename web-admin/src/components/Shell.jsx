import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Organizations" },
  { to: "/users", label: "Users" },
  { to: "/drivers", label: "Drivers" },
  { to: "/emergencies", label: "Emergencies" },
  { to: "/reports", label: "Reports" },
];

export default function Shell() {
  const { logout, profile } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-full flex flex-col md:flex-row bg-slate-950">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 border-r border-slate-800 transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-slate-800">
          <p className="text-xs uppercase tracking-wider text-slate-400">
            MedSwift
          </p>
          <p className="text-lg font-semibold text-white">Super Admin</p>
          {profile?.name && (
            <p className="text-sm text-slate-400 mt-1 truncate">{profile.name}</p>
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
                  isActive
                    ? "bg-primary-accent text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => logout()}
            className="mt-4 text-left rounded-lg px-3 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            Sign out
          </button>
        </nav>
      </aside>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 flex md:hidden items-center justify-between gap-3 bg-slate-900 border-b border-slate-800 px-4 py-3">
          <button
            type="button"
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
            onClick={() => setOpen(true)}
          >
            Menu
          </button>
          <span className="font-semibold text-white truncate">MedSwift Admin</span>
          <span className="w-14" />
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
