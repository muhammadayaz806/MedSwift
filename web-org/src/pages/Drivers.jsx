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
  const [pwErr, setPwErr] = useState("");
  const [loading, setLoading] = useState(true);

  function validatePassword(pw) {
    if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*_]).{8,}$/.test(pw)) {
      return "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 digit, and 1 special character (!@#$%^&*_).";
    }
    return "";
  }

  async function refresh() {
    setErr("");
    setLoading(true);
    const token = await getToken();
    const d = await api("/org/drivers", { method: "GET" }, token);
    setDrivers(d.drivers || []);
    setLoading(false);
  }

  useEffect(() => {
    refresh().catch((e) => {
      setErr(e.message);
      setDrivers([]);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addDriver(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    const validationError = validatePassword(password);
    if (validationError) {
      setErr(validationError);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existsLocally = drivers.some(
      (d) => d.email?.trim().toLowerCase() === normalizedEmail
    );
    if (existsLocally) {
      setErr("A driver with this email address already exists. Please use a different email.");
      return;
    }

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
        <h1 className="text-2xl font-bold text-brand-text">Drivers</h1>
        <p className="text-brand-sub text-sm mt-1">
          Create driver credentials for your ambulance crews.
        </p>
      </div>

      <form
        onSubmit={addDriver}
        className="rounded-2xl bg-brand-card border border-brand-border p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="lg:col-span-2">
          <label className="text-sm font-medium text-brand-text">Name</label>
          <input
            className="mt-1 w-full rounded-lg border border-brand-border bg-brand-card px-3 py-2 text-sm text-brand-text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-text">Email</label>
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-brand-border bg-brand-card px-3 py-2 text-sm text-brand-text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-text">Password</label>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-brand-border bg-brand-card px-3 py-2 text-sm text-brand-text"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPwErr(validatePassword(e.target.value));
            }}
            required
            minLength={8}
          />
          {pwErr && (
            <p className="mt-1 text-xs text-brand-red">{pwErr}</p>
          )}
        </div>
        <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap gap-3 items-center">
          <button
            type="submit"
            className="rounded-xl bg-brand-emergency text-white font-semibold px-6 py-2.5 hover:bg-brand-red transition"
          >
            Add driver
          </button>
          {msg && <span className="text-sm text-green-700">{msg}</span>}
          {err && <span className="text-sm text-brand-red">{err}</span>}
        </div>
      </form>

      <div className="rounded-2xl bg-brand-card border border-brand-border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-brand-surface text-brand-sub text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Ambulance</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Online</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-brand-sub">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-sub border-t-transparent" />
                    <span>Loading drivers…</span>
                  </div>
                </td>
              </tr>
            ) : drivers.length ? (
              drivers.map((d) => (
                <tr key={d.id} className="border-t border-brand-muted">
                  <td className="px-4 py-3">{d.name}</td>
                  <td className="px-4 py-3 break-all">{d.email}</td>
                  <td className="px-4 py-3">
                    {d.ambulancePlate ? (
                      <span className="inline-flex items-center rounded-full bg-brand-emergency px-2.5 py-1 text-xs font-bold text-white tracking-widest font-mono">
                        {d.ambulancePlate}
                      </span>
                    ) : (
                      <span className="text-brand-sub text-xs">—</span>
                    )}
                  </td>
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
                      className="text-brand-red hover:underline"
                      onClick={() => remove(d.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-brand-sub">
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
