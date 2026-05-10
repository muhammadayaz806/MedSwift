import { useEffect, useMemo, useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { onValue, ref } from "firebase/database";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { rtdb } from "../lib/firebase";

const mapContainerStyle = { width: "100%", height: "min(70vh, 560px)" };

export default function Overview() {
  const { getToken } = useAuth();
  const [emergencies, setEmergencies] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [live, setLive] = useState({});
  const [err, setErr] = useState("");
  const [orgInfo, setOrgInfo] = useState(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const [e, d, s] = await Promise.all([
          api("/org/emergencies/active", { method: "GET" }, token),
          api("/org/drivers", { method: "GET" }, token),
          api("/org/status", { method: "GET" }, token),
        ]);
        if (!cancelled) {
          setEmergencies(e.emergencies || []);
          setDrivers(d.drivers || []);
          setOrgInfo(s.organization);
        }
      } catch (ex) {
        if (!cancelled) setErr(ex.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  useEffect(() => {
    const unsubs = [];
    for (const dr of drivers) {
      const r = ref(rtdb, `liveLocations/${dr.id}`);
      unsubs.push(
        onValue(r, (snap) => {
          const v = snap.val();
          setLive((prev) => ({ ...prev, [dr.id]: v }));
        })
      );
    }
    return () => unsubs.forEach((u) => u());
  }, [drivers]);

  const center = useMemo(() => {
    const first = emergencies.find((x) => x.location?.latitude != null);
    if (first?.location) {
      return {
        lat: first.location.latitude,
        lng: first.location.longitude,
      };
    }
    const keys = Object.keys(live);
    if (keys.length && live[keys[0]]) {
      return {
        lat: live[keys[0]].latitude,
        lng: live[keys[0]].longitude,
      };
    }
    return { lat: 24.8607, lng: 67.0011 };
  }, [emergencies, live]);

  const pending = emergencies.filter((x) => x.status === "pending");
  const active = emergencies.filter((x) => x.status === "accepted");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Operations overview</h1>
        <p className="text-slate-600 text-sm mt-1">
          Live emergencies and ambulance positions for your organization.
        </p>
      </div>

      {orgInfo && !orgInfo.verified && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-950 px-4 py-3 text-sm">
          Your organization is <strong>pending approval</strong>. Some actions stay
          restricted until a super admin verifies your account.
        </div>
      )}

      {err && (
        <div className="rounded-xl bg-red-50 text-emergency px-4 py-3 text-sm">{err}</div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl bg-white shadow-sm border border-slate-200 p-4">
          <p className="text-xs uppercase text-slate-500 font-semibold">
            Pending dispatch
          </p>
          <p className="text-3xl font-bold text-emergency mt-1">{pending.length}</p>
        </div>
        <div className="rounded-xl bg-white shadow-sm border border-slate-200 p-4">
          <p className="text-xs uppercase text-slate-500 font-semibold">
            Active trips
          </p>
          <p className="text-3xl font-bold text-primary mt-1">{active.length}</p>
        </div>
        <div className="rounded-xl bg-white shadow-sm border border-slate-200 p-4">
          <p className="text-xs uppercase text-slate-500 font-semibold">
            Online drivers
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            {drivers.filter((d) => d.isOnline).length}
          </p>
        </div>
      </div>

      {!apiKey ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-4 text-sm">
          Add <code className="font-mono">VITE_GOOGLE_MAPS_API_KEY</code> to{" "}
          <code className="font-mono">web-org/.env</code> to enable the map.
        </div>
      ) : (
        <LoadScript googleMapsApiKey={apiKey}>
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={11}
            >
              {emergencies.map((em) =>
                em.location?.latitude != null ? (
                  <Marker
                    key={em.id}
                    position={{
                      lat: em.location.latitude,
                      lng: em.location.longitude,
                    }}
                    label={em.status === "pending" ? "P" : "E"}
                  />
                ) : null
              )}
              {drivers.map((dr) => {
                const L = live[dr.id];
                if (!L?.latitude) return null;
                return (
                  <Marker
                    key={`live-${dr.id}`}
                    position={{ lat: L.latitude, lng: L.longitude }}
                    icon={{
                      url:
                        "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                    }}
                  />
                );
              })}
            </GoogleMap>
          </div>
        </LoadScript>
      )}

      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Request</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 hidden sm:table-cell">User</th>
            </tr>
          </thead>
          <tbody>
            {emergencies.slice(0, 20).map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-mono text-xs">{row.id}</td>
                <td className="px-4 py-2 capitalize">{row.status}</td>
                <td className="px-4 py-2 hidden sm:table-cell">{row.userId}</td>
              </tr>
            ))}
            {!emergencies.length && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                  No active rows. Pending requests from users appear here once the
                  API notifies drivers.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
