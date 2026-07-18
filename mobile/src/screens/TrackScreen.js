import React, { useEffect, useMemo, useState } from "react";
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
  const [liveTimestamp, setLiveTimestamp] = useState(null);
  const [liveAgeText, setLiveAgeText] = useState("updated just now");
  const [err, setErr] = useState("");
  const [region, setRegion] = useState({
    latitude: 24.8607,
    longitude: 67.0011,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });

  useEffect(() => {
    let unsubscribeLocation = () => {};
    let cancelled = false;
    let intervalId = null;

    const refreshStatus = async () => {
      try {
        const token = await getToken();
        const status = await api("/emergency/status", { method: "GET" }, token);
        if (cancelled) return;

        const payload = status.request ?? status;
        if (!payload?.id) {
          setRequest(null);
          setLive(null);
          setErr("");
          return;
        }

        setRequest(payload);
        setErr("");
        setRegion({
          latitude: payload.location?.latitude ?? 24.8607,
          longitude: payload.location?.longitude ?? 67.0011,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        });

        if (payload.driverId) {
          const r = ref(rtdb, `liveLocations/${payload.driverId}`);
          unsubscribeLocation();
          unsubscribeLocation = onValue(r, (locationSnap) => {
            if (!cancelled) {
              const nextLive = locationSnap.val();
              setLive(nextLive);
              if (nextLive?.timestamp) {
                setLiveTimestamp(nextLive.timestamp);
              }
            }
          });
        } else {
          setLive(null);
          setLiveTimestamp(null);
          unsubscribeLocation();
        }
      } catch (e) {
        if (!cancelled) setErr(e.message);
      }
    };

    refreshStatus();
    intervalId = setInterval(refreshStatus, 5000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      unsubscribeLocation();
    };
  }, [getToken]);

  const userCoord = useMemo(
    () =>
      request?.location?.latitude != null
        ? {
            latitude: request.location.latitude,
            longitude: request.location.longitude,
          }
        : null,
    [request]
  );

  const ambCoord = useMemo(
    () =>
      live?.latitude != null
        ? { latitude: live.latitude, longitude: live.longitude }
        : null,
    [live]
  );

  const coordsLine = useMemo(
    () => (userCoord && ambCoord ? [userCoord, ambCoord] : ambCoord ? [ambCoord] : []),
    [ambCoord, userCoord]
  );

  // Only resets to "updated just now" when a genuinely new GPS ping arrives
  // (i.e. liveTimestamp actually changes). The 5s status poll no longer
  // touches this timer, so it can't cause a false reset/jump.
  useEffect(() => {
    if (!liveTimestamp) {
      setLiveAgeText("updated just now");
      return undefined;
    }

    setLiveAgeText("updated just now");
    const intervalId = setInterval(() => {
      const secondsAgo = Math.max(0, Math.floor((Date.now() - liveTimestamp) / 1000));
      setLiveAgeText(secondsAgo === 0 ? "updated just now" : `updated ${secondsAgo}s ago`);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [liveTimestamp]);

  useEffect(() => {
    if (!userCoord && !ambCoord) return;
    const centerPoint = ambCoord || userCoord;
    setRegion({
      latitude: centerPoint.latitude,
      longitude: centerPoint.longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    });
  }, [ambCoord, userCoord]);

  const useGoogle = Platform.OS === "android" || Platform.OS === "ios";

  return (
    <View style={styles.flex}>
      <View style={styles.banner}>
        <Text style={styles.title}>Track ambulance</Text>
        {request?.id && (
          <Text style={styles.meta}>
            Your Request is {request.status}
            {/* Request {request.id.slice(0, 8)}… · {request.status} */}
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
          region={region}
          onRegionChangeComplete={setRegion}
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
        {request?.driverId && (
          <View style={styles.plateRow}>
            <Text style={styles.plateLabel}>🚑 Ambulance on the way</Text>
            {request?.ambulancePlate ? (
              <View style={styles.plateChip}>
                <Text style={styles.plateChipTxt}>{request.ambulancePlate}</Text>
              </View>
            ) : (
              <Text style={styles.plateMuted}>Number not assigned</Text>
            )}
          </View>
        )}
        {request?.driverId && !ambCoord && (
          <Text style={[styles.sheetTxt, { marginTop: 4 }]}>Waiting for GPS lock…</Text>
        )}
        {ambCoord && <Text style={styles.sheetTxt}>Live · {liveAgeText}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff7f7" },
  banner: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#7f1d1d",
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "800" },
  meta: { color: "#fecaca", marginTop: 4, fontSize: 13 },
  map: { flex: 1 },
  sheet: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#fecaca",
  },
  sheetTxt: { color: "#7f1d1d" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  plateRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  plateLabel: { color: "#7f1d1d", fontWeight: "800", fontSize: 13 },
  plateChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#7f1d1d",
  },
  plateChipTxt: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 1.5,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
  },
  plateMuted: { color: "#991b1b", fontSize: 12, fontStyle: "italic" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  muted: { color: "#991b1b" },
  err: { color: "#b91c1c", padding: 16 },
});