import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function Ambulances() {
  const { getToken } = useAuth();
  const [ambulances, setAmbulances] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [plate, setPlate] = useState("");
  const [driverId, setDriverId] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setErr("");
    setLoading(true);
    const token = await getToken();
    const [a, d] = await Promise.all([
      api("/org/ambulances", { method: "GET" }, token),
      api("/org/drivers", { method: "GET" }, token),
    ]);
    setAmbulances(a.ambulances || []);
    setDrivers(d.drivers || []);
    setLoading(false);
  }

  useEffect(() => {
    refresh().catch((e) => {
      setErr(e.message);
      setAmbulances([]);
      setDrivers([]);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addAmbulance(e) {
    e.preventDefault();
    setErr("");
    try {
      const token = await getToken();
      await api(
        "/org/ambulance/add",
        {
          method: "POST",
          body: JSON.stringify({
            plate,
            driverId: driverId || null,
          }),
        },
        token
      );
      setPlate("");
      setDriverId("");
      await refresh();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  async function assign(id, did) {
    setErr("");
    try {
      const token = await getToken();
      await api(
        `/org/ambulance/${id}`,
        { method: "PATCH", body: JSON.stringify({ driverId: did || null }) },
        token
      );
      await refresh();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  async function removeAmbulance(id) {
    if (!confirm("Delete this ambulance?")) return;
    setErr("");
    try {
      const token = await getToken();
      await api(`/org/ambulance/${id}`, { method: "DELETE" }, token);
      await refresh();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-brand-text">Ambulances</h1>
        <p className="text-brand-sub text-sm mt-1">
          Register fleet units and assign drivers.
        </p>
      </div>

      <form
        onSubmit={addAmbulance}
        className="rounded-2xl bg-brand-card border border-brand-border p-6 flex flex-col sm:flex-row gap-4 items-end"
      >
        <div className="flex-1 w-full">
          <label className="text-sm font-medium text-brand-text">Plate / ID</label>
          <input
            className="mt-1 w-full rounded-lg border border-brand-border bg-brand-card px-3 py-2 text-sm text-brand-text"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="e.g. KH-227"
            required
            pattern="^[A-Z0-9]+([ -][A-Z0-9]+)*$"
            title="Only uppercase letters and numbers separated by a single space or hyphen are allowed. No consecutive spaces or hyphens."
          />
        </div>
        <div className="flex-1 w-full">
          <label className="text-sm font-medium text-brand-text">
            Assign driver (optional)
          </label>
          <select
            className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2 text-sm bg-brand-card text-brand-text"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
          >
            <option value="">— None —</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.email})
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full sm:w-auto rounded-xl bg-brand-emergency text-white font-semibold px-6 py-2.5 hover:bg-brand-red transition"
        >
          Add ambulance
        </button>
      </form>
      {err && (
        <div className="text-sm text-brand-red bg-brand-muted rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      <div className="rounded-2xl bg-brand-card border border-brand-border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-brand-surface text-brand-sub text-left">
            <tr>
              <th className="px-4 py-3">Ambulance</th>
              <th className="px-4 py-3">Assigned driver</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-brand-sub">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-sub border-t-transparent" />
                    <span>Loading ambulances…</span>
                  </div>
                </td>
              </tr>
            ) : ambulances.length ? (
              ambulances.map((a) => (
                <tr key={a.id} className="border-t border-brand-muted">
                  {/* <td className="px-4 py-3 font-semibold">{a.plate}</td>
                  <td className="px-4 py-3 font-mono text-xs">{a.driverId || "—"}</td> */}
                  <td className="px-4 py-3 font-semibold font-mono">{a.plate}</td>
                  <td className="px-4 py-3">{a.driverName || <span className="text-brand-sub text-xs">— Unassigned</span>}</td>
                  <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                    <select
                      className="rounded-lg border border-brand-border bg-brand-card px-2 py-1 text-xs max-w-[200px] text-brand-text animate-none"
                      value={a.driverId || ""}
                      onChange={(e) => assign(a.id, e.target.value)}
                    >
                      <option value="">— None —</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="text-brand-red hover:underline text-xs"
                      onClick={() => removeAmbulance(a.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-brand-sub">
                  No ambulances registered.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
