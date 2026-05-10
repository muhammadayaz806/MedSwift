import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function UserHomeScreen({ navigation }) {
  const { getToken } = useAuth();
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const loadLocation = useCallback(async () => {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setMsg("Location permission is required for dispatch.");
      setLoading(false);
      return;
    }
    const pos = await Location.getCurrentPositionAsync({});
    setCoords({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  async function sendEmergency() {
    if (!coords) return;
    setSending(true);
    setMsg("");
    try {
      const token = await getToken();
      await api(
        "/emergency/request",
        {
          method: "POST",
          body: JSON.stringify({
            lat: coords.latitude,
            lng: coords.longitude,
          }),
        },
        token
      );
      setMsg("Emergency sent. Open Track to follow your ambulance.");
      navigation.navigate("Track");
    } catch (e) {
      setMsg(e.message || "Could not send request");
    } finally {
      setSending(false);
    }
  }

  const useGoogle =
    Platform.OS === "android" || Platform.OS === "ios";

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greet}>Emergency dashboard</Text>
          <Text style={styles.hint}>Tap the red control only for real emergencies.</Text>
        </View>
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => Linking.openURL("tel:1122")}
        >
          <Text style={styles.secondaryLbl}>1122</Text>
        </Pressable>
      </View>

      <View style={styles.mapWrap}>
        {loading || !coords ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#dc2626" />
            <Text style={styles.mapFallback}>Getting GPS fix…</Text>
          </View>
        ) : (
          <MapView
            style={StyleSheet.absoluteFill}
            provider={useGoogle ? PROVIDER_GOOGLE : undefined}
            initialRegion={{
              latitude: coords.latitude,
              longitude: coords.longitude,
              latitudeDelta: 0.06,
              longitudeDelta: 0.06,
            }}
            showsUserLocation
          >
            <Marker coordinate={coords} title="You are here" />
          </MapView>
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.question}>IS IT AN EMERGENCY?</Text>
        <Text style={styles.panelSub}>
          Press below — nearby verified ambulance crews are notified immediately.
        </Text>

        <Pressable
          style={[styles.emergencyOuter, sending && { opacity: 0.7 }]}
          onPress={sendEmergency}
          disabled={sending || !coords}
        >
          <View style={styles.emergencyInner}>
            <Text style={styles.emergencyIcon}>🚑</Text>
          </View>
        </Pressable>

        {!!msg && <Text style={styles.feedback}>{msg}</Text>}

        <View style={styles.row}>
          <Pressable
            style={styles.linkBtn}
            onPress={() => navigation.navigate("Track")}
          >
            <Text style={styles.linkTxt}>Track ambulance</Text>
          </Pressable>
          <Pressable
            style={styles.linkBtn}
            onPress={() => navigation.navigate("Support")}
          >
            <Text style={styles.linkTxt}>Support</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#0b1224" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greet: { color: "#fff", fontSize: 20, fontWeight: "800" },
  hint: { color: "#94a3b8", marginTop: 4, maxWidth: "78%" },
  secondaryBtn: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  secondaryLbl: { color: "#fff", fontWeight: "800" },
  mapWrap: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
    gap: 8,
  },
  mapFallback: { color: "#94a3b8" },
  panel: {
    padding: 20,
    paddingBottom: 28,
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  question: {
    color: "#fff",
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center",
  },
  panelSub: {
    color: "#cbd5f5",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  emergencyOuter: {
    alignSelf: "center",
    width: 132,
    height: 132,
    borderRadius: 999,
    backgroundColor: "#7f1d1d",
    alignItems: "center",
    justifyContent: "center",
  },
  emergencyInner: {
    width: 112,
    height: 112,
    borderRadius: 999,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
  },
  emergencyIcon: { fontSize: 42 },
  feedback: {
    color: "#bbf7d0",
    textAlign: "center",
    marginTop: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  linkBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#334155",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  linkTxt: { color: "#93c5fd", fontWeight: "700" },
});
