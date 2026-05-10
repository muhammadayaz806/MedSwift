import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function Drivers() {
  const { getToken } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function refresh() {
    const token = await getToken();
    const d = await api("/org/drivers", { method: "GET" }, token);
    setDrivers(d.drivers || []);
  }

  useEffect(() => {
    refresh().catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addDriver(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      const token = await getToken();
      await api(
        "/org/driver/add",
        {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        },
        token
      );
      setName("");
      setEmail("");
      setPassword("");
      setMsg("Driver created.");
      await refresh();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  async function toggle(driverId, status) {
    setErr("");
    try {
      const token = await getToken();
      await api(
        `/org/driver/${driverId}`,
        { method: "PATCH", body: JSON.stringify({ status }) },
        token
      );
      await refresh();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  async function remove(driverId) {
    if (!confirm("Remove driver account?")) return;
    setErr("");
    try {
      const token = await getToken();
      await api(`/org/driver/${driverId}`, { method: "DELETE" }, token);
      await refresh();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Drivers</h1>
        <p className="text-slate-600 text-sm mt-1">
          Create driver credentials for your ambulance crews.
        </p>
      </div>

      <form
        onSubmit={addDriver}
        className="rounded-2xl bg-white border border-slate-200 p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="lg:col-span-2">
          <label className="text-sm font-medium text-slate-700">Name</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap gap-3 items-center">
          <button
            type="submit"
            className="rounded-xl bg-primary text-white font-semibold px-6 py-2.5"
          >
            Add driver
          </button>
          {msg && <span className="text-sm text-green-700">{msg}</span>}
          {err && <span className="text-sm text-emergency">{err}</span>}
        </div>
      </form>

      <div className="rounded-2xl bg-white border border-slate-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Online</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{d.name}</td>
                <td className="px-4 py-3 break-all">{d.email}</td>
                <td className="px-4 py-3 capitalize">{d.status}</td>
                <td className="px-4 py-3">{d.isOnline ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  {d.status === "active" ? (
                    <button
                      type="button"
                      className="text-amber-700 hover:underline"
                      onClick={() => toggle(d.id, "inactive")}
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-green-700 hover:underline"
                      onClick={() => toggle(d.id, "active")}
                    >
                      Activate
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-emergency hover:underline"
                    onClick={() => remove(d.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!drivers.length && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  No drivers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
