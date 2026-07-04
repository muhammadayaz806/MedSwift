import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function History() {
  const { getToken } = useAuth();
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const h = await api("/org/emergencies/history", { method: "GET" }, token);
        if (!cancelled) setRows(h.history || []);
      } catch (e) {
        if (!cancelled) setErr(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-text">Emergency history</h1>
        <p className="text-brand-sub text-sm mt-1">
          Completed dispatches linked to your organization.
        </p>
      </div>
      {err && (
        <div className="text-sm text-brand-red bg-brand-muted rounded-lg px-3 py-2">
          {err}
        </div>
      )}
      <div className="rounded-2xl bg-brand-card border border-brand-border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-brand-surface text-brand-sub text-left">
            <tr>
              <th className="px-4 py-3">Request</th>
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3">Completed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-brand-muted">
                <td className="px-4 py-3">
                  <div className="font-medium text-brand-text">
                    {r.requestLabel || "Completed emergency"}
                  </div>
                  <div className="text-[11px] text-brand-sub mt-1 font-mono">
                    {r.id}
                  </div>
                </td>
                <td className="px-4 py-3">{r.driverName || r.driverId || "—"}</td>
                <td className="px-4 py-3">{r.organizationName || "—"}</td>
                <td className="px-4 py-3">
                  {r.completedAt
                    ? new Date(r.completedAt).toLocaleString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : "—"}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-brand-sub">
                  No completed emergencies yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
