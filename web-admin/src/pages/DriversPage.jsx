import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function DriversPage() {
  const { getToken } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr("");
      setLoading(true);
      try {
        const token = await getToken();
        const r = await api("/admin/drivers", { method: "GET" }, token);
        if (!cancelled) setDrivers(r.drivers || []);
      } catch (e) {
        if (!cancelled) {
          setErr(e.message);
          setDrivers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">Drivers</h1>
        <p className="text-brand-sub text-sm mt-1">
          Global roster across organizations.
        </p>
      </div>
      {err && (
        <div className="text-sm text-brand-accent bg-brand-muted/40 border border-brand-border rounded-lg px-3 py-2">
          {err}
        </div>
      )}
      <div className="rounded-2xl bg-brand-card border border-brand-border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-brand-bg text-left text-brand-sub">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3 hidden sm:table-cell">Email</th>
              <th className="px-4 py-3">Org</th>
              <th className="px-4 py-3">Online</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="text-brand-text">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-brand-sub">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-sub border-t-transparent" />
                    <span>Loading drivers…</span>
                  </div>
                </td>
              </tr>
            ) : drivers.length ? (
              drivers.map((d) => (
                <tr key={d.id} className="border-t border-brand-border">
                  <td className="px-4 py-3">{d.name}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-brand-sub">
                    {d.email}
                  </td>
                  <td className="px-4 py-3 text-sm">{d.organizationName || d.orgId || "No organization"}</td>
                  <td className="px-4 py-3">{d.isOnline ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 capitalize">{d.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-brand-sub">
                  No drivers.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
