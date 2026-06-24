import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function RoleSelectionScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>MedSwift</Text>
      <Text style={styles.title}>How are you signing in?</Text>
      <Text style={styles.sub}>
        Choose your account type to continue. Citizens and drivers use different
        features in the app.
      </Text>

      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate("Login", { role: "user" })}
      >
        <MaterialCommunityIcons name="account-heart" size={36} color="#93c5fd" />
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>Citizen</Text>
          <Text style={styles.cardSub}>
            Request emergency help and track ambulance arrival
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={28} color="#64748b" />
      </Pressable>

      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate("Login", { role: "driver" })}
      >
        <MaterialCommunityIcons name="ambulance" size={36} color="#fca5a5" />
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>Ambulance driver</Text>
          <Text style={styles.cardSub}>
            Accept trips and share live location with dispatch
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={28} color="#64748b" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 24,
    paddingTop: 72,
    gap: 16,
  },
  brand: {
    color: "#93c5fd",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 8 },
  sub: { color: "#94a3b8", marginBottom: 8, lineHeight: 22 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  cardSub: { color: "#94a3b8", fontSize: 14, lineHeight: 20 },
});
