import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Platform } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { onValue, ref } from "firebase/database";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { rtdb } from "../lib/firebase";

export default function TrackScreen() {
  const { getToken } = useAuth();
  const [request, setRequest] = useState(null);
  const [live, setLive] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let unsub = () => {};
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const status = await api("/emergency/status", { method: "GET" }, token);
        if (cancelled) return;
        const payload = status.request ?? status;
        if (!payload?.id) {
          setRequest(null);
          return;
        }
        setRequest(payload);
        const driverId = payload.driverId;
        if (!driverId) {
          setLive(null);
          return;
        }
        const r = ref(rtdb, `liveLocations/${driverId}`);
        unsub = onValue(r, (snap) => {
          setLive(snap.val());
        });
      } catch (e) {
        if (!cancelled) setErr(e.message);
      }
    })();
    return () => {
      cancelled = true;
      unsub();
    };
  }, [getToken]);

  const userCoord =
    request?.location?.latitude != null
      ? {
          latitude: request.location.latitude,
          longitude: request.location.longitude,
        }
      : null;

  const ambCoord =
    live?.latitude != null
      ? { latitude: live.latitude, longitude: live.longitude }
      : null;

  const centerPoint = ambCoord || userCoord || {
    latitude: 24.8607,
    longitude: 67.0011,
  };

  const coordsLine =
    userCoord && ambCoord ? [userCoord, ambCoord] : ambCoord ? [ambCoord] : [];

  const useGoogle = Platform.OS === "android" || Platform.OS === "ios";

  const initialRegion = {
    latitude: centerPoint.latitude,
    longitude: centerPoint.longitude,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  return (
    <View style={styles.flex}>
      <View style={styles.banner}>
        <Text style={styles.title}>Track ambulance</Text>
        {request?.id && (
          <Text style={styles.meta}>
            Request {request.id.slice(0, 8)}… · {request.status}
          </Text>
        )}
      </View>

      {err ? (
        <Text style={styles.err}>{err}</Text>
      ) : !request ? (
        <View style={styles.center}>
          <Text style={styles.muted}>No active emergency on file.</Text>
        </View>
      ) : (
        <MapView
          style={styles.map}
          provider={useGoogle ? PROVIDER_GOOGLE : undefined}
          initialRegion={initialRegion}
        >
          {userCoord && <Marker coordinate={userCoord} title="Pickup" pinColor="#2563eb" />}
          {ambCoord && (
            <Marker coordinate={ambCoord} title="Ambulance" pinColor="#dc2626" />
          )}
          {coordsLine.length === 2 && (
            <Polyline
              coordinates={coordsLine}
              strokeColor="#dc2626"
              strokeWidth={4}
            />
          )}
        </MapView>
      )}

      <View style={styles.sheet}>
        {!request?.driverId && request?.status === "pending" && (
          <View style={styles.row}>
            <ActivityIndicator color="#dc2626" />
            <Text style={styles.sheetTxt}>Waiting for a driver to accept…</Text>
          </View>
        )}
        {request?.driverId && !ambCoord && (
          <Text style={styles.sheetTxt}>Ambulance assigned — waiting for GPS lock.</Text>
        )}
        {ambCoord && (
          <Text style={styles.sheetTxt}>
            Live · updated{" "}
            {live?.timestamp
              ? `${Math.round((Date.now() - live.timestamp) / 1000)}s ago`
              : "now"}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#0b1224" },
  banner: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#1e4db7",
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "800" },
  meta: { color: "#dbeafe", marginTop: 4, fontSize: 13 },
  map: { flex: 1 },
  sheet: {
    padding: 16,
    backgroundColor: "#0f172a",
    borderTopWidth: 1,
    borderColor: "#1e293b",
  },
  sheetTxt: { color: "#e2e8f0" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  muted: { color: "#94a3b8" },
  err: { color: "#fecaca", padding: 16 },
});
