import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function Reports() {
  const { getToken } = useAuth();
  const [reports, setReports] = useState([]);
  const [counts, setCounts] = useState({});
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const r = await api("/admin/reports", { method: "GET" }, token);
        if (!cancelled) {
          setReports(r.reports || []);
          setCounts(r.countsByUser || {});
        }
      } catch (e) {
        if (!cancelled) setErr(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  const topOffenders = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">Abuse reports</h1>
        <p className="text-brand-sub text-sm mt-1">
          False emergency filings. Users auto-suspend after three validated strikes
          (handled server-side).
        </p>
      </div>
      {err && (
        <div className="text-sm text-brand-accent bg-brand-muted/40 border border-brand-border rounded-lg px-3 py-2">
          {err}
        </div>
      )}
      {!!topOffenders.length && (
        <div className="rounded-2xl bg-brand-card border border-brand-border p-4">
          <p className="text-sm font-semibold text-brand-text mb-3">
            Report counts by user
          </p>
          <div className="flex flex-wrap gap-2">
            {topOffenders.map(([uid, c]) => (
              <span
                key={uid}
                className="rounded-full bg-brand-bg border border-brand-border px-3 py-1 text-xs font-mono text-brand-soft"
              >
                {uid.slice(0, 8)}… ({c})
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="rounded-2xl bg-brand-card border border-brand-border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-brand-bg text-left text-brand-sub">
            <tr>
              <th className="px-4 py-3">Request</th>
              <th className="px-4 py-3">Reporter</th>
              <th className="px-4 py-3">Reported user</th>
              <th className="px-4 py-3 hidden lg:table-cell">Notes</th>
            </tr>
          </thead>
          <tbody className="text-brand-text">
            {reports.map((r) => (
              <tr key={r.id} className="border-t border-brand-border align-top">
                <td className="px-4 py-3 font-mono text-xs">{r.requestId}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.reporterId}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.reportedUserId}</td>
                <td className="px-4 py-3 hidden lg:table-cell text-brand-sub">
                  {r.notes || "—"}
                </td>
              </tr>
            ))}
            {!reports.length && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-brand-sub">
                  No reports logged.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
