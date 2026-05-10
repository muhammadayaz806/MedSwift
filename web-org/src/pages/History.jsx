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
        <h1 className="text-2xl font-bold text-slate-900">Emergency history</h1>
        <p className="text-slate-600 text-sm mt-1">
          Completed dispatches linked to your organization.
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
              <th className="px-4 py-3">Request</th>
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3 hidden md:table-cell">Completed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-mono text-xs">{r.id}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.driverId}</td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {r.completedAt || "—"}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-slate-500">
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
