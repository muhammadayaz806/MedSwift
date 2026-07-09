import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Linking,
  Platform,
  SafeAreaView,
  Animated,
  PanResponder,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function UserHomeScreen({ navigation }) {
  const COLLAPSED_PANEL_HEIGHT = 270;
  const EXPANDED_PANEL_HEIGHT = 400;
  const COLLAPSED_OFFSET = EXPANDED_PANEL_HEIGHT - COLLAPSED_PANEL_HEIGHT;
  const { getToken } = useAuth();
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const panelTranslateY = React.useRef(
    new Animated.Value(COLLAPSED_OFFSET)
  ).current;
  const panelExpandedRef = React.useRef(false);
  const dragStartRef = React.useRef(COLLAPSED_OFFSET);

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
      const result = await api(
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
      if (result?.existing) {
        setMsg("You already have an active emergency request. Open Track to follow it.");
      } else {
        setMsg("Emergency sent. Open Track to follow your ambulance.");
      }
      navigation.navigate("Track");
    } catch (e) {
      setMsg(e.message || "Could not send request");
    } finally {
      setSending(false);
    }
  }

  const useGoogle =
    Platform.OS === "android" || Platform.OS === "ios";

  const snapPanel = useCallback(
    (expand) => {
      panelExpandedRef.current = expand;
      Animated.spring(panelTranslateY, {
        toValue: expand ? 0 : COLLAPSED_OFFSET,
        useNativeDriver: false,
        damping: 20,
        stiffness: 190,
      }).start();
    },
    [panelTranslateY]
  );

  const panelResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 8,
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        Math.abs(gestureState.dy) > 4,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        panelTranslateY.stopAnimation((value) => {
          dragStartRef.current = value;
        });
      },
      onPanResponderMove: (_, gestureState) => {
        const nextOffset = Math.max(
          0,
          Math.min(COLLAPSED_OFFSET, dragStartRef.current + gestureState.dy)
        );
        panelTranslateY.setValue(nextOffset);
      },
      onPanResponderRelease: (_, gestureState) => {
        const movedEnough = Math.abs(gestureState.dy) > 24;
        if (movedEnough) {
          snapPanel(gestureState.dy < 0);
          return;
        }
        panelTranslateY.stopAnimation((value) => {
          snapPanel(value < COLLAPSED_OFFSET / 2);
        });
      },
    })
  ).current;

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.header}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.greet}>Emergency Assistance</Text>
          <Text style={styles.hint}>
            Fast, verified response when every second matters.
          </Text>
          <View style={styles.statusRow}>
            <View style={styles.statusChip}>
              <MaterialCommunityIcons
                name="shield-check"
                size={13}
                color="#166534"
              />
              <Text style={styles.statusChipTxt}>Verified crews</Text>
            </View>
            <View style={styles.statusChip}>
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={13}
                color="#166534"
              />
              <Text style={styles.statusChipTxt}>Live GPS</Text>
            </View>
          </View>
        </View>
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => Linking.openURL("tel:1122")}
        >
          <MaterialCommunityIcons name="phone-alert" size={14} color="#fff" />
          <Text style={styles.secondaryLbl}>Call 1122</Text>
        </Pressable>
      </View>

      <View style={[styles.mapWrap, { marginBottom: COLLAPSED_PANEL_HEIGHT - 245 }]}>
        <View style={styles.mapHeaderBadge}>
          <Text style={styles.mapHeaderBadgeText}>Live Location</Text>
        </View>

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

        {!loading && !!coords && (
          <View style={styles.mapOverlayCard}>
            <Text style={styles.mapOverlayTitle}>Connected</Text>
            <View style={styles.mapOverlayMeta}>
              <MaterialCommunityIcons name="map-marker-radius" size={14} color="#dc2626" />
              <Text style={styles.mapOverlayMetaTxt}>Dispatch precision enabled</Text>
            </View>
          </View>
        )}
      </View>

      <Animated.View
        style={[
          styles.panel,
          {
            height: EXPANDED_PANEL_HEIGHT,
            transform: [{ translateY: panelTranslateY }],
          },
        ]}
      >
        <View
          style={styles.dragHandleWrap}
          {...panelResponder.panHandlers}
        >
          <View style={styles.dragHandle} />
        </View>

        <Text style={styles.question}>IS THIS AN EMERGENCY?</Text>
        <Text style={styles.panelSub}>
          Press the button below to alert nearby verified ambulance crews.
        </Text>

        <Pressable
          style={[styles.emergencyOuter, sending && { opacity: 0.7 }]}
          onPress={sendEmergency}
          disabled={sending || !coords}
        >
          <View style={styles.emergencyInner}>
            <Text style={styles.emergencyIcon}>🚑</Text>
            <Text style={styles.emergencyLabel}>
              {sending ? "Sending..." : "SOS"}
            </Text>
          </View>
        </Pressable>

        {!!msg && <Text style={styles.feedback}>{msg}</Text>}

        <View style={styles.row}>
          <Pressable
            style={styles.linkBtn}
            onPress={() => navigation.navigate("Track")}
          >
            <MaterialCommunityIcons
              name="map-marker-path"
              size={18}
              color="#dc2626"
            />
            <Text style={styles.linkTxt}>Track Ambulance</Text>
          </Pressable>
          <Pressable
            style={styles.linkBtn}
            onPress={() => navigation.navigate("Support")}
          >
            <MaterialCommunityIcons
              name="face-agent"
              size={18}
              color="#dc2626"
            />
            <Text style={styles.linkTxt}>Support</Text>
          </Pressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#fff7f7",
    position: "relative",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  greet: {
    color: "#7f1d1d",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  hint: {
    color: "#7f1d1d",
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    maxWidth: "95%",
  },
  statusRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  statusChipTxt: {
    color: "#991b1b",
    fontSize: 11,
    fontWeight: "700",
  },
  secondaryBtn: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    shadowColor: "#ef4444",
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  secondaryLbl: {
    color: "#fff",
    fontWeight: "900",
    letterSpacing: 0.2,
    fontSize: 12,
  },
  mapWrap: {
    flex: 1.2,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#ffffff",
    shadowColor: "#020617",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  mapHeaderBadge: {
    position: "absolute",
    zIndex: 5,
    top: 12,
    left: 12,
    backgroundColor: "rgba(127,29,29,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  mapHeaderBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fee2e2",
    gap: 8,
  },
  mapFallback: { color: "#7f1d1d", fontSize: 13 },
  mapOverlayCard: {
    position: "absolute",
    bottom: 12,
    right: 12,
    left: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingVertical: 8,
    paddingHorizontal: 10,
    maxWidth: "100%",
  },
  mapOverlayTitle: {
    color: "#7f1d1d",
    fontWeight: "800",
    fontSize: 12,
    marginBottom: 1,
  },
  mapOverlayMeta: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  mapOverlayMetaTxt: {
    color: "#b91c1c",
    fontSize: 11,
    fontWeight: "700",
  },
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: "#fecaca",
    shadowColor: "#450a0a",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 18,
  },
  dragHandleWrap: {
    alignItems: "center",
    paddingBottom: 8,
  },
  dragHandle: {
    width: 54,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#fca5a5",
  },
  question: {
    color: "#7f1d1d",
    fontWeight: "900",
    letterSpacing: 1.1,
    textAlign: "center",
    fontSize: 15,
  },
  panelSub: {
    color: "#991b1b",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 10,
    lineHeight: 20,
    fontSize: 13,
  },
  emergencyOuter: {
    alignSelf: "center",
    width: 152,
    height: 152,
    borderRadius: 999,
    backgroundColor: "rgba(185,28,28,0.34)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.42)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#f43f5e",
    shadowOpacity: 0.42,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  emergencyInner: {
    width: 126,
    height: 126,
    borderRadius: 999,
    backgroundColor: "#ef4444",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  emergencyIcon: { fontSize: 38 },
  emergencyLabel: {
    color: "#fff",
    marginTop: 2,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  feedback: {
    color: "#b91c1c",
    textAlign: "center",
    marginTop: 12,
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    gap: 12,
  },
  linkBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fff5f5",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#0f172a",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  linkTxt: {
    color: "#7f1d1d",
    fontWeight: "800",
    letterSpacing: 0.2,
    fontSize: 13,
  },
});
