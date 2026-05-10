import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function Reports() {
  const { getToken } = useAuth();
  const [reports, setReports] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const r = await api("/org/reports/false", { method: "GET" }, token);
        if (!cancelled) setReports(r.reports || []);
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
        <h1 className="text-2xl font-bold text-slate-900">False emergency reports</h1>
        <p className="text-slate-600 text-sm mt-1">
          Reports filed by your drivers for abuse review.
        </p>
      </div>
      {err && (
        <div className="text-sm text-emergency bg-red-50 rounded-lg px-3 py-2">
          {err}
        </div>
      )}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              <th className="px-4 py-3">Report</th>
              <th className="px-4 py-3">Reporter</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3 hidden lg:table-cell">Notes</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 align-top">
                <td className="px-4 py-3 font-mono text-xs">{r.requestId}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.reporterId}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.reportedUserId}</td>
                <td className="px-4 py-3 hidden lg:table-cell text-slate-600">
                  {r.notes || "—"}
                </td>
              </tr>
            ))}
            {!reports.length && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
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
