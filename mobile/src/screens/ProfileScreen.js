import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function ProfileScreen() {
  const { profile, logout } = useAuth();

  return (
    <View style={styles.flex}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{profile?.name || "—"}</Text>
        <Text style={[styles.label, { marginTop: 12 }]}>Email</Text>
        <Text style={styles.value}>{profile?.email || "—"}</Text>
        <Text style={[styles.label, { marginTop: 12 }]}>Role</Text>
        <Text style={styles.value}>{profile?.role || "—"}</Text>
        <Text style={[styles.label, { marginTop: 12 }]}>Account status</Text>
        <Text style={styles.value}>{profile?.status || "—"}</Text>
      </View>

      <Pressable style={styles.btn} onPress={() => logout()}>
        <Text style={styles.btnLbl}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff7f7", padding: 20, paddingTop: 56 },
  title: { color: "#7f1d1d", fontSize: 24, fontWeight: "800", marginBottom: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  label: { color: "#b91c1c", fontSize: 12, textTransform: "uppercase" },
  value: { color: "#7f1d1d", fontSize: 16, marginTop: 4 },
  btn: {
    marginTop: 24,
    backgroundColor: "#dc2626",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnLbl: { color: "#fff", fontWeight: "700" },
});
