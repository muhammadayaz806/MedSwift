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

  async function refresh() {
    const token = await getToken();
    const [a, d] = await Promise.all([
      api("/org/ambulances", { method: "GET" }, token),
      api("/org/drivers", { method: "GET" }, token),
    ]);
    setAmbulances(a.ambulances || []);
    setDrivers(d.drivers || []);
  }

  useEffect(() => {
    refresh().catch((e) => setErr(e.message));
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ambulances</h1>
        <p className="text-slate-600 text-sm mt-1">
          Register fleet units and assign drivers.
        </p>
      </div>

      <form
        onSubmit={addAmbulance}
        className="rounded-2xl bg-white border border-slate-200 p-6 flex flex-col sm:flex-row gap-4 items-end"
      >
        <div className="flex-1 w-full">
          <label className="text-sm font-medium text-slate-700">Plate / ID</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="e.g. KH-227"
            required
          />
        </div>
        <div className="flex-1 w-full">
          <label className="text-sm font-medium text-slate-700">
            Assign driver (optional)
          </label>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
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
          className="w-full sm:w-auto rounded-xl bg-primary text-white font-semibold px-6 py-2.5"
        >
          Add ambulance
        </button>
      </form>
      {err && (
        <div className="text-sm text-emergency bg-red-50 rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      <div className="rounded-2xl bg-white border border-slate-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              <th className="px-4 py-3">Ambulance</th>
              <th className="px-4 py-3">Assigned driver</th>
              <th className="px-4 py-3 text-right">Change</th>
            </tr>
          </thead>
          <tbody>
            {ambulances.map((a) => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-semibold">{a.plate}</td>
                <td className="px-4 py-3 font-mono text-xs">{a.driverId || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <select
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs max-w-[200px]"
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
                </td>
              </tr>
            ))}
            {!ambulances.length && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-slate-500">
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
