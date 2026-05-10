import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function DriversPage() {
  const { getToken } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const r = await api("/admin/drivers", { method: "GET" }, token);
        if (!cancelled) setDrivers(r.drivers || []);
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
        <h1 className="text-2xl font-bold text-white">Drivers</h1>
        <p className="text-slate-400 text-sm mt-1">
          Global roster across organizations.
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
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3 hidden sm:table-cell">Email</th>
              <th className="px-4 py-3">Org</th>
              <th className="px-4 py-3">Online</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="text-slate-200">
            {drivers.map((d) => (
              <tr key={d.id} className="border-t border-slate-800">
                <td className="px-4 py-3">{d.name}</td>
                <td className="px-4 py-3 hidden sm:table-cell text-slate-400">
                  {d.email}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{d.orgId}</td>
                <td className="px-4 py-3">{d.isOnline ? "Yes" : "No"}</td>
                <td className="px-4 py-3 capitalize">{d.status}</td>
              </tr>
            ))}
            {!drivers.length && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
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
