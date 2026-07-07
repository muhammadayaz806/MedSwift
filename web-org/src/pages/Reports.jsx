import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function Reports() {
  const { getToken } = useAuth();
  const [reports, setReports] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr("");
      setLoading(true);
      try {
        const token = await getToken();
        const r = await api("/org/reports/false", { method: "GET" }, token);
        if (!cancelled) setReports(r.reports || []);
      } catch (e) {
        if (!cancelled) {
          setErr(e.message);
          setReports([]);
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
        <h1 className="text-2xl font-bold text-brand-text">False emergency reports</h1>
        <p className="text-brand-sub text-sm mt-1">
          Reports filed by your drivers for abuse review.
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
              <th className="px-4 py-3">Report</th>
              <th className="px-4 py-3">Reporter</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3 hidden lg:table-cell">Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-brand-sub">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-sub border-t-transparent" />
                    <span>Loading reports…</span>
                  </div>
                </td>
              </tr>
            ) : reports.length ? (
              reports.map((r) => (
                <tr key={r.id} className="border-t border-brand-muted align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-brand-text">{r.requestLabel || "Emergency request"}</div>
                    <div className="text-[11px] text-brand-sub mt-1 font-mono">{r.requestId || r.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-brand-text">{r.reporterName || r.reporterId || "—"}</div>
                    {r.reporterEmail && r.reporterEmail !== "—" ? (
                      <div className="text-[11px] text-brand-sub mt-1">{r.reporterEmail}</div>
                    ) : (
                      <div className="text-[11px] text-brand-sub mt-1 font-mono">{r.reporterId || "—"}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-brand-text">{r.reportedUserName || r.reportedUserId || "—"}</div>
                    {r.reportedUserEmail && r.reportedUserEmail !== "—" ? (
                      <div className="text-[11px] text-brand-sub mt-1">{r.reportedUserEmail}</div>
                    ) : (
                      <div className="text-[11px] text-brand-sub mt-1 font-mono">{r.reportedUserId || "—"}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-brand-sub">
                    {r.notes || "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-brand-sub">
                  No reports from your drivers.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
