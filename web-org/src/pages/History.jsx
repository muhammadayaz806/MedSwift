import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function History() {
  const { getToken } = useAuth();
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setErr("");
    setLoading(true);
    try {
      const token = await getToken();
      const h = await api("/org/emergencies/history", { method: "GET" }, token);
      const sortedHistory = (h.history || []).sort((a, b) => {
        const aTime = new Date(a.completedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.completedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      });
      setRows(sortedHistory);
    } catch (e) {
      setErr(e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Emergency history</h1>
          <p className="text-brand-sub text-sm mt-1">
            Completed dispatches linked to your organization.
          </p>
        </div>
        <button
          type="button"
          onClick={loadHistory}
          className="shrink-0 rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-text hover:bg-brand-muted transition"
        >
          Refresh
        </button>
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
              <th className="px-4 py-3">Ambulance</th>
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3">Completed</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-brand-sub">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-sub border-t-transparent" />
                    <span>Loading history…</span>
                  </div>
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((r) => (
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
                  <td className="px-4 py-3">
                    {r.ambulancePlate ? (
                      <span className="inline-flex items-center rounded-full bg-brand-emergency px-2.5 py-1 text-xs font-bold text-white tracking-widest font-mono">
                        {r.ambulancePlate}
                      </span>
                    ) : (
                      <span className="text-brand-sub">—</span>
                    )}
                  </td>
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
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-brand-sub">
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
