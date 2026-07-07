import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function Reports() {
  const { getToken } = useAuth();
  const [reports, setReports] = useState([]);
  const [counts, setCounts] = useState({});
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr("");
      setLoading(true);
      try {
        const token = await getToken();
        const r = await api("/admin/reports", { method: "GET" }, token);
        if (!cancelled) {
          setReports(r.reports || []);
          setCounts(r.countsByUser || {});
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e.message);
          setReports([]);
          setCounts({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  const topOffenders = Object.values(
    reports.reduce((acc, report) => {
      const userId = report.reportedUserId;
      if (!userId) return acc;

      const existing = acc[userId] || {
        id: userId,
        name: report.reportedUserName || report.reportedUserId || "Unknown user",
        count: 0,
      };

      existing.count += 1;
      if (report.reportedUserName) existing.name = report.reportedUserName;

      acc[userId] = existing;
      return acc;
    }, {})
  ).sort((a, b) => b.count - a.count)
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
            {topOffenders.map((offender) => (
              <span
                key={offender.id}
                className="rounded-full bg-brand-bg border border-brand-border px-3 py-1 text-xs text-brand-soft"
              >
                {offender.name || "Unknown user"} ({offender.count})
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
                <tr key={r.id} className="border-t border-brand-border align-top">
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
