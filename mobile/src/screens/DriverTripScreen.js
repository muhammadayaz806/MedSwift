import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Linking,
  Platform,
  SafeAreaView,
} from "react-native";
import * as Location from "expo-location";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

function buildMapsUrl(lat, lng) {
  const coords = `${lat},${lng}`;
  return (
    Platform.select({
      ios: `comgooglemaps://?daddr=${coords}&directionsmode=driving`,
      android: `google.navigation:q=${coords}`,
    }) ||
    `https://www.google.com/maps/dir/?api=1&destination=${coords}&travelmode=driving`
  );
}

export default function DriverTripScreen({ route, navigation }) {
  const {
    requestId,
    requestLabel,
    destinationLat: paramLat,
    destinationLng: paramLng,
  } = route.params || {};
  const { getToken } = useAuth();
  const timer = useRef(null);
  const [destination, setDestination] = useState(() =>
    paramLat != null && paramLng != null
      ? { latitude: paramLat, longitude: paramLng }
      : null
  );

  useEffect(() => {
    if (destination || !requestId) return undefined;

    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const r = await api("/driver/requests", { method: "GET" }, token);
        const active = r.activeRequest;
        if (
          cancelled ||
          active?.id !== requestId ||
          active?.location?.latitude == null ||
          active?.location?.longitude == null
        ) {
          return;
        }
        setDestination({
          latitude: active.location.latitude,
          longitude: active.location.longitude,
        });
      } catch {
        /* ignore — openMaps will prompt if still missing */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [requestId, destination, getToken]);

  useEffect(() => {
    if (!requestId) return undefined;

    async function pushLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const pos = await Location.getCurrentPositionAsync({});
        const token = await getToken();
        await api(
          "/driver/location",
          {
            method: "POST",
            body: JSON.stringify({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            }),
          },
          token
        );
      } catch {
        /* ignore transient GPS errors */
      }
    }

    pushLocation();
    timer.current = setInterval(pushLocation, 8000);

    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [requestId, getToken]);

  async function openMaps() {
    if (destination?.latitude == null || destination?.longitude == null) {
      Alert.alert(
        "Location unavailable",
        "The emergency pickup coordinates are not on file yet. Pull to refresh on the driver home screen and try again."
      );
      return;
    }

    const { latitude, longitude } = destination;
    const primary = buildMapsUrl(latitude, longitude);
    const fallback = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;

    try {
      const canOpen = await Linking.canOpenURL(primary);
      await Linking.openURL(canOpen ? primary : fallback);
    } catch {
      Linking.openURL(fallback).catch(() => {
        Alert.alert("Maps unavailable", "Could not open navigation on this device.");
      });
    }
  }

  async function completeTrip() {
    try {
      const token = await getToken();
      await api(
        "/driver/complete",
        { method: "POST", body: JSON.stringify({ requestId }) },
        token
      );
      navigation.popToTop();
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  }

  async function submitReport(notes) {
    try {
      const token = await getToken();
      await api(
        "/driver/report-false",
        {
          method: "POST",
          body: JSON.stringify({ requestId, notes: notes || "" }),
        },
        token
      );
      Alert.alert("Recorded", "Safety desk will review this report.");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  }

  function reportFalse() {
    if (Platform.OS === "ios") {
      Alert.prompt(
        "False emergency",
        "Describe why this dispatch was abusive (optional)",
        (notes) => submitReport(notes),
        "plain-text"
      );
    } else {
      Alert.alert(
        "Report false emergency?",
        "This flags the citizen account for admin review.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Report",
            style: "destructive",
            onPress: () => submitReport(""),
          },
        ]
      );
    }
  }

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>Active trip</Text>
        <View style={styles.reqChip}>
          <Text style={styles.reqChipLbl}>Dispatch</Text>
          <Text style={styles.reqChipVal}>{requestLabel || "Emergency request"}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Live GPS streaming</Text>
        <Text style={styles.body}>
          Location updates are sent to MedSwift every eight seconds while this screen stays open. Keep the app foregrounded during transport.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.secondary} onPress={openMaps}>
          <Text style={styles.secondaryLbl}>Open maps</Text>
        </Pressable>

        <Pressable style={styles.primary} onPress={completeTrip}>
          <Text style={styles.primaryLbl}>Complete trip</Text>
        </Pressable>
      </View>

      <Pressable style={styles.dangerOutline} onPress={reportFalse}>
        <Text style={styles.dangerLbl}>Report false emergency</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#fff7f7",
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 14,
  },
  header: { paddingTop: 8, gap: 10 },
  title: { color: "#7f1d1d", fontSize: 26, fontWeight: "900", letterSpacing: 0.2 },
  reqChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#fecaca",
    maxWidth: "100%",
    flexShrink: 1,
  },
  reqChipLbl: { color: "#b91c1c", fontSize: 11, fontWeight: "900", letterSpacing: 0.6, textTransform: "uppercase", flexShrink: 0 },
  reqChipVal: {
    color: "#7f1d1d",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
    fontWeight: "800",
    flex: 1,
    flexShrink: 1,
    flexWrap: "wrap",
  },
  card: {
    marginTop: 4,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
    shadowColor: "#020617",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardTitle: { color: "#7f1d1d", fontWeight: "900", marginBottom: 6 },
  body: { color: "#991b1b", lineHeight: 20, fontSize: 13 },
  actions: { gap: 10, marginTop: 2 },
  secondary: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fff5f5",
    alignItems: "center",
  },
  secondaryLbl: { color: "#7f1d1d", fontWeight: "900", letterSpacing: 0.2 },
  primary: {
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#dc2626",
    alignItems: "center",
    shadowColor: "#dc2626",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  primaryLbl: { color: "#fff", fontWeight: "900", fontSize: 16, letterSpacing: 0.2 },
  dangerOutline: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dc2626",
    alignItems: "center",
    backgroundColor: "rgba(254, 202, 202, 0.35)",
  },
  dangerLbl: { color: "#991b1b", fontWeight: "900", letterSpacing: 0.1 },
});
