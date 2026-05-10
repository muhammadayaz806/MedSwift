import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function Organizations() {
  const { getToken } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [err, setErr] = useState("");

  async function refresh() {
    const token = await getToken();
    const r = await api("/admin/organizations", { method: "GET" }, token);
    setOrgs(r.organizations || []);
  }

  useEffect(() => {
    refresh().catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function approve(id, approve) {
    setErr("");
    try {
      const token = await getToken();
      await api(
        "/admin/approve",
        { method: "POST", body: JSON.stringify({ orgId: id, approve }) },
        token
      );
      await refresh();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function toggleActive(id, active) {
    setErr("");
    try {
      const token = await getToken();
      await api(
        "/admin/suspend-org",
        { method: "POST", body: JSON.stringify({ orgId: id, active }) },
        token
      );
      await refresh();
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Organizations</h1>
        <p className="text-slate-400 text-sm mt-1">
          Approve new EMS providers and suspend abusive operators.
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
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-slate-200">
            {orgs.map((o) => (
              <tr key={o.id} className="border-t border-slate-800">
                <td className="px-4 py-3 font-medium">{o.name}</td>
                <td className="px-4 py-3 hidden sm:table-cell text-slate-400">
                  {o.email}
                </td>
                <td className="px-4 py-3">{o.verified ? "Yes" : "No"}</td>
                <td className="px-4 py-3">{o.active !== false ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  {!o.verified && (
                    <>
                      <button
                        type="button"
                        className="text-green-400 hover:underline"
                        onClick={() => approve(o.id, true)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="text-slate-400 hover:underline"
                        onClick={() => approve(o.id, false)}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {o.verified && (
                    <button
                      type="button"
                      className="text-amber-400 hover:underline"
                      onClick={() => toggleActive(o.id, o.active === false)}
                    >
                      {o.active === false ? "Activate" : "Suspend"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!orgs.length && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  No organizations registered.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
