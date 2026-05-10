import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function Emergencies() {
  const { getToken } = useAuth();
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const r = await api("/admin/emergencies/active", { method: "GET" }, token);
        if (!cancelled) setRows(r.emergencies || []);
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
        <h1 className="text-2xl font-bold text-white">Active emergencies</h1>
        <p className="text-slate-400 text-sm mt-1">
          Pending and in-progress dispatches system-wide.
        </p>
      </div>
      {err && (
        <div className="text-sm text-red-300 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
          {err}
        </div>
      )}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-950 text-left text-slate-400">
            <tr>
              <th className="px-4 py-3">Request</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 hidden md:table-cell">User</th>
              <th className="px-4 py-3 hidden lg:table-cell">Driver</th>
            </tr>
          </thead>
          <tbody className="text-slate-200">
            {rows.map((x) => (
              <tr key={x.id} className="border-t border-slate-800">
                <td className="px-4 py-3 font-mono text-xs">{x.id}</td>
                <td className="px-4 py-3 capitalize">{x.status}</td>
                <td className="px-4 py-3 hidden md:table-cell font-mono text-xs">
                  {x.userId}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell font-mono text-xs">
                  {x.driverId || "—"}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                  No active emergencies.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
