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
        <h1 className="text-2xl font-bold text-white">Abuse reports</h1>
        <p className="text-slate-400 text-sm mt-1">
          False emergency filings. Users auto-suspend after three validated strikes
          (handled server-side).
        </p>
      </div>
      {err && (
        <div className="text-sm text-red-300 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
          {err}
        </div>
      )}
      {!!topOffenders.length && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <p className="text-sm font-semibold text-slate-200 mb-3">
            Report counts by user
          </p>
          <div className="flex flex-wrap gap-2">
            {topOffenders.map(([uid, c]) => (
              <span
                key={uid}
                className="rounded-full bg-slate-950 border border-slate-800 px-3 py-1 text-xs font-mono text-slate-300"
              >
                {uid.slice(0, 8)}… ({c})
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-950 text-left text-slate-400">
            <tr>
              <th className="px-4 py-3">Request</th>
              <th className="px-4 py-3">Reporter</th>
              <th className="px-4 py-3">Reported user</th>
              <th className="px-4 py-3 hidden lg:table-cell">Notes</th>
            </tr>
          </thead>
          <tbody className="text-slate-200">
            {reports.map((r) => (
              <tr key={r.id} className="border-t border-slate-800 align-top">
                <td className="px-4 py-3 font-mono text-xs">{r.requestId}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.reporterId}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.reportedUserId}</td>
                <td className="px-4 py-3 hidden lg:table-cell text-slate-400">
                  {r.notes || "—"}
                </td>
              </tr>
            ))}
            {!reports.length && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
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
