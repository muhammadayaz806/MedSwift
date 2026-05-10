import React, { useCallback, useEffect, useState } from "react";
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
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function DriverHomeScreen({ navigation }) {
  const { getToken, logout } = useAuth();
  const [online, setOnline] = useState(false);
  const [requests, setRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const token = await getToken();
    const r = await api("/driver/requests", { method: "GET" }, token);
    setRequests(r.requests || []);
  }, [getToken]);

  useEffect(() => {
    load().catch((e) => setMsg(e.message));
  }, [load]);

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

  async function accept(id) {
    try {
      const token = await getToken();
      await api(
        "/driver/accept",
        { method: "POST", body: JSON.stringify({ requestId: id }) },
        token
      );
      navigation.navigate("DriverTrip", { requestId: id });
      await load();
    } catch (e) {
      Alert.alert("Could not accept", e.message);
    }
  }

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Driver console</Text>
          <Text style={styles.sub}>Stay online to receive dispatches.</Text>
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.signOutBtn} onPress={() => logout()}>
            <Text style={styles.signOutLbl}>Sign out</Text>
          </Pressable>
          <View style={styles.switchRow}>
            <Text style={styles.switchLbl}>{online ? "Online" : "Offline"}</Text>
            <Switch value={online} onValueChange={toggleOnline} />
          </View>
        </View>
      </View>

      {!!msg && <Text style={styles.msg}>{msg}</Text>}

      <Text style={styles.section}>Nearby pending requests</Text>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No open requests right now.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.id}</Text>
            <Text style={styles.cardMeta}>Status: {item.status}</Text>
            <Pressable style={styles.acceptBtn} onPress={() => accept(item.id)}>
              <Text style={styles.acceptLbl}>Accept & navigate</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#0b1224", paddingTop: 52 },
  header: {
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
  sub: { color: "#94a3b8", marginTop: 4 },
  actions: { alignItems: "flex-end", gap: 10 },
  signOutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#475569",
    backgroundColor: "#1e293b",
  },
  signOutLbl: { color: "#e2e8f0", fontWeight: "700" },
  switchRow: { alignItems: "flex-end" },
  switchLbl: { color: "#e2e8f0", marginBottom: 6, fontWeight: "600" },
  msg: { color: "#bbf7d0", paddingHorizontal: 20, marginBottom: 8 },
  section: {
    color: "#93c5fd",
    fontWeight: "700",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  empty: { color: "#64748b", textAlign: "center", marginTop: 40 },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  cardTitle: { color: "#fff", fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }) },
  cardMeta: { color: "#94a3b8", marginTop: 6 },
  acceptBtn: {
    marginTop: 12,
    backgroundColor: "#dc2626",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  acceptLbl: { color: "#fff", fontWeight: "800" },
});
