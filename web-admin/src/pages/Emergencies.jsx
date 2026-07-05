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
        <h1 className="text-2xl font-bold text-brand-ink">Active emergencies</h1>
        <p className="text-brand-sub text-sm mt-1">
          Pending and in-progress dispatches system-wide.
        </p>
      </div>
      {err && (
        <div className="text-sm text-brand-accent bg-brand-muted/40 border border-brand-border rounded-lg px-3 py-2">
          {err}
        </div>
      )}
      <div className="rounded-2xl bg-brand-card border border-brand-border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-brand-bg text-left text-brand-sub">
            <tr>
              <th className="px-4 py-3">Request</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3">Driver Org</th>
            </tr>
          </thead>
          <tbody className="text-brand-text">
            {rows.map((x) => (
              <tr key={x.id} className="border-t border-brand-border align-top">
                <td className="px-4 py-3">
                  <div className="font-medium text-brand-text">{x.requestLabel || "Emergency request"}</div>
                  <div className="text-[11px] text-brand-sub mt-1 font-mono">{x.id}</div>
                </td>
                <td className="px-4 py-3 capitalize">{x.status}</td>
                <td className="px-4 py-3">{x.userName || x.userId || "—"}</td>
                <td className="px-4 py-3">{x.userEmail || "—"}</td>
                <td className="px-4 py-3">{x.driverName || x.driverId || "—"}</td>
                <td className="px-4 py-3">{x.driverOrganizationName || "—"}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-brand-sub">
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
