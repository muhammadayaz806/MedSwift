import React, { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function DriverHomeScreen({ navigation }) {
  const { getToken, logout } = useAuth();
  const [online, setOnline] = useState(false);
  const [requests, setRequests] = useState([]);
  const [activeRequest, setActiveRequest] = useState(null);
  const [ambulancePlate, setAmbulancePlate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const token = await getToken();
    const r = await api("/driver/requests", { method: "GET" }, token);
    setOnline(Boolean(r.isOnline));
    setActiveRequest(r.activeRequest || null);
    setRequests(r.requests || []);
    setAmbulancePlate(r.ambulancePlate || null);
  }, [getToken]);

  useEffect(() => {
    load().catch((e) => setMsg(e.message));
    const interval = setInterval(() => {
      load().catch(() => {});
    }, 8000);
    return () => clearInterval(interval);
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load().catch((e) => setMsg(e.message));
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function toggleOnline(next) {
    try {
      const token = await getToken();
      await api(
        "/driver/status",
        { method: "PATCH", body: JSON.stringify({ isOnline: next }) },
        token
      );
      setOnline(next);
      setMsg(next ? "You are visible for dispatch." : "You are offline.");
    } catch (e) {
      Alert.alert("Status update failed", e.message);
    }
  }

  async function accept(item) {
    if (!online) {
      Alert.alert("Go online first", "Enable availability before accepting.");
      return;
    }
    if (activeRequest?.id) {
      Alert.alert(
        "Trip in progress",
        "Complete your current emergency trip before accepting another request."
      );
      return;
    }
    try {
      const token = await getToken();
      await api(
        "/driver/accept",
        { method: "POST", body: JSON.stringify({ requestId: item.id }) },
        token
      );
      const requestLabel = item.requestLabel || "Emergency request";
      setActiveRequest({ id: item.id, status: "accepted", requestLabel, location: item.location });
      navigation.navigate("DriverTrip", {
        requestId: item.id,
        requestLabel,
        ambulancePlate: ambulancePlate || undefined,
        destinationLat: item.location?.latitude,
        destinationLng: item.location?.longitude,
      });
      await load();
    } catch (e) {
      Alert.alert("Could not accept", e.message);
    }
  }

  function resumeTrip() {
    if (!activeRequest?.id) return;
    navigation.navigate("DriverTrip", {
      requestId: activeRequest.id,
      requestLabel: activeRequest.requestLabel || "Emergency request",
      ambulancePlate: ambulancePlate || undefined,
      destinationLat: activeRequest.location?.latitude,
      destinationLng: activeRequest.location?.longitude,
    });
  }

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Driver Console</Text>
            <Text style={styles.sub}>Go online to receive dispatches.</Text>
          </View>

          <Pressable style={styles.signOutBtn} onPress={() => logout()}>
            <Text style={styles.signOutLbl}>Sign out</Text>
          </Pressable>
        </View>

        {!!ambulancePlate && (
          <View style={styles.plateRow}>
            <Text style={styles.plateLabel}>🚑 Ambulance</Text>
            <View style={styles.plateChip}>
              <Text style={styles.plateChipTxt}>{ambulancePlate}</Text>
            </View>
          </View>
        )}

        <View style={styles.statusRow}>
          <View style={[styles.statusChip, online ? styles.statusChipOn : styles.statusChipOff]}>
            <Text style={[styles.statusChipTxt, online ? styles.statusChipTxtOn : styles.statusChipTxtOff]}>
              {online ? "Online" : "Offline"}
            </Text>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLbl}>Availability</Text>
            <Switch value={online} onValueChange={toggleOnline} />
          </View>
        </View>
      </View>

      {!!msg && <Text style={styles.msg}>{msg}</Text>}

      {!!activeRequest?.id && (
        <View style={styles.activeWrap}>
          <Text style={styles.activeTitle}>Active emergency assigned</Text>
          {!!ambulancePlate && (
            <View style={styles.activePlateRow}>
              <Text style={styles.activePlateLabel}>Your ambulance:</Text>
              <View style={styles.activePlateChip}>
                <Text style={styles.activePlateChipTxt}>{ambulancePlate}</Text>
              </View>
            </View>
          )}
          <Text style={styles.activeMeta}>
            {activeRequest.requestLabel || "Emergency request"} is still active. Re-open trip to continue GPS and complete it.
          </Text>
          <Pressable style={styles.activeBtn} onPress={resumeTrip}>
            <Text style={styles.activeLbl}>Resume active trip</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        contentContainerStyle={styles.listContent}
        data={requests}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby pending requests</Text>
            <Text style={styles.sectionSub}>
              {activeRequest?.id
                ? "Finish your active trip before new dispatches become available."
                : online
                  ? "Pull to refresh. Accepting opens the active trip screen."
                  : "You are offline. Go online to receive dispatches."}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>
              {activeRequest?.id ? "No new dispatches" : "No open requests"}
            </Text>
            <Text style={styles.emptySub}>
              {activeRequest?.id
                ? "Complete your active trip to receive new emergency requests."
                : "Stay online — dispatches will appear here."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const tripInProgress = !!activeRequest?.id;
          const canAccept = online && !tripInProgress;
          return (
            <View style={styles.card}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardTitle} numberOfLines={3}>
                  {item.requestLabel || "Emergency request"}
                </Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeTxt}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>
                {tripInProgress
                  ? "Complete your active trip before accepting another request."
                  : "Tap accept to start navigation and begin GPS streaming."}
              </Text>
              <Pressable
                style={[styles.acceptBtn, !canAccept && styles.acceptBtnDisabled]}
                onPress={() => accept(item)}
                disabled={!canAccept}
              >
                <Text style={styles.acceptLbl}>Accept & navigate</Text>
              </Pressable>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff7f7" },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 18,
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  headerTextWrap: { flex: 1, paddingRight: 10 },
  title: { color: "#7f1d1d", fontSize: 26, fontWeight: "900", letterSpacing: 0.2 },
  sub: { color: "#991b1b", marginTop: 6, fontSize: 13, lineHeight: 18, maxWidth: "96%" },
  signOutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "#ef4444",
    shadowColor: "#ef4444",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  signOutLbl: { color: "#fff", fontWeight: "900", letterSpacing: 0.2, fontSize: 12 },
  statusRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusChipOn: { backgroundColor: "#ffffff", borderColor: "#fecaca" },
  statusChipOff: { backgroundColor: "#fff5f5", borderColor: "#fecaca" },
  statusChipTxt: { fontSize: 12, fontWeight: "900", letterSpacing: 0.2 },
  statusChipTxtOn: { color: "#166534" },
  statusChipTxtOff: { color: "#991b1b" },
  switchRow: { alignItems: "flex-end" },
  switchLbl: { color: "#7f1d1d", marginBottom: 6, fontWeight: "800", fontSize: 12 },
  msg: { color: "#b91c1c", paddingHorizontal: 20, marginBottom: 4, fontWeight: "700" },
  plateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
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
  activeWrap: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fca5a5",
    backgroundColor: "#fff5f5",
  },
  activeTitle: { color: "#7f1d1d", fontWeight: "900", fontSize: 13 },
  activeMeta: { color: "#991b1b", marginTop: 6, lineHeight: 18, fontSize: 12, flexShrink: 1 },
  activeBtn: {
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: "#b91c1c",
  },
  activeLbl: { color: "#fff", fontWeight: "900", letterSpacing: 0.2 },
  activePlateRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  activePlateLabel: { color: "#7f1d1d", fontWeight: "800", fontSize: 12 },
  activePlateChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: "#7f1d1d" },
  activePlateChipTxt: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 1.5,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
  },
  listContent: { paddingBottom: 16 },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 10 },
  sectionTitle: { color: "#7f1d1d", fontWeight: "900", fontSize: 14, letterSpacing: 0.2 },
  sectionSub: { color: "#991b1b", marginTop: 4, fontSize: 12, lineHeight: 17 },
  emptyWrap: {
    marginTop: 16,
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#fecaca",
    alignItems: "center",
  },
  emptyTitle: { color: "#7f1d1d", fontWeight: "900" },
  emptySub: { color: "#991b1b", marginTop: 6, textAlign: "center", lineHeight: 18, fontSize: 12 },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#fecaca",
    shadowColor: "#020617",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  cardTitle: {
    color: "#7f1d1d",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
    fontWeight: "800",
    flex: 1,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#fff5f5",
    borderWidth: 1,
    borderColor: "#fecaca",
    flexShrink: 0,
  },
  badgeTxt: { color: "#991b1b", fontWeight: "900", fontSize: 11, letterSpacing: 0.2 },
  cardMeta: { color: "#7f1d1d", marginTop: 8, lineHeight: 18, fontSize: 12, opacity: 0.9 },
  acceptBtn: {
    marginTop: 12,
    backgroundColor: "#dc2626",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#dc2626",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  acceptLbl: { color: "#fff", fontWeight: "900", letterSpacing: 0.2 },
  acceptBtnDisabled: { opacity: 0.5 },
});
