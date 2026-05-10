import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Linking,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function DriverTripScreen({ route, navigation }) {
  const { requestId } = route.params || {};
  const { getToken } = useAuth();
  const timer = useRef(null);

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
    const url =
      Platform.select({
        ios: `maps://?daddr=Emergency`,
        android: `geo:0,0?q=Emergency`,
      }) || "https://maps.google.com";
    Linking.openURL(url).catch(() => {});
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
    <View style={styles.flex}>
      <Text style={styles.title}>Active trip</Text>
      <Text style={styles.meta}>Request {requestId}</Text>
      <Text style={styles.body}>
        GPS updates stream to MedSwift every eight seconds while this screen stays
        open. Keep the app foregrounded during transport for the demo.
      </Text>

      <Pressable style={styles.secondary} onPress={openMaps}>
        <Text style={styles.secondaryLbl}>Open maps</Text>
      </Pressable>

      <Pressable style={styles.primary} onPress={completeTrip}>
        <Text style={styles.primaryLbl}>Complete trip</Text>
      </Pressable>

      <Pressable style={styles.dangerOutline} onPress={reportFalse}>
        <Text style={styles.dangerLbl}>Report false emergency</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#0b1224",
    paddingHorizontal: 20,
    paddingTop: 56,
    gap: 14,
  },
  title: { color: "#fff", fontSize: 26, fontWeight: "800" },
  meta: { color: "#94a3b8", fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }) },
  body: { color: "#cbd5f5", lineHeight: 22 },
  secondary: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
  },
  secondaryLbl: { color: "#e2e8f0", fontWeight: "700" },
  primary: {
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#16a34a",
    alignItems: "center",
  },
  primaryLbl: { color: "#fff", fontWeight: "800", fontSize: 16 },
  dangerOutline: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dc2626",
    alignItems: "center",
  },
  dangerLbl: { color: "#fecaca", fontWeight: "700" },
});
