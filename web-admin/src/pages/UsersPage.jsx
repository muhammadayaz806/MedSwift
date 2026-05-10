import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function UsersPage() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const r = await api("/admin/users", { method: "GET" }, token);
        if (!cancelled) setUsers(r.users || []);
      } catch (e) {
        if (!cancelled) setErr(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  async function suspend(userId, suspended) {
    setErr("");
    try {
      const token = await getToken();
      await api(
        "/admin/suspend-user",
        { method: "POST", body: JSON.stringify({ userId, suspended }) },
        token
      );
      const r = await api("/admin/users", { method: "GET" }, token);
      setUsers(r.users || []);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-slate-400 text-sm mt-1">
          Monitor citizen accounts and enforcement status.
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
              <th className="px-4 py-3 hidden md:table-cell">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 hidden lg:table-cell">Reports</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-slate-200">
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-800">
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3 hidden md:table-cell text-slate-400">
                  {u.email}
                </td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3 capitalize">{u.status}</td>
                <td className="px-4 py-3 hidden lg:table-cell">{u.reportCount ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  {u.role === "user" && (
                    <button
                      type="button"
                      className="text-amber-400 hover:underline"
                      onClick={() => suspend(u.id, u.status !== "suspended")}
                    >
                      {u.status === "suspended" ? "Unsuspend" : "Suspend"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!users.length && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No users.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
