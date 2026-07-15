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
        onPress={() => navigation.replace("Login", { role: "user" })}
      >
        <MaterialCommunityIcons name="account-heart" size={36} color="#ef4444" />
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>Citizen</Text>
          <Text style={styles.cardSub}>
            Request emergency help and track ambulance arrival
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={28} color="#fca5a5" />
      </Pressable>

      <Pressable
        style={styles.card}
        onPress={() => navigation.replace("Login", { role: "driver" })}
      >
        <MaterialCommunityIcons name="ambulance" size={36} color="#ef4444" />
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>Ambulance driver</Text>
          <Text style={styles.cardSub}>
            Accept trips and share live location with dispatch
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={28} color="#fca5a5" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff7f7",
    padding: 24,
    paddingTop: 72,
    gap: 16,
  },
  brand: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: { color: "#7f1d1d", fontSize: 28, fontWeight: "900", marginTop: 8 },
  sub: { color: "#991b1b", marginBottom: 8, lineHeight: 22 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#fecaca",
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { color: "#7f1d1d", fontSize: 18, fontWeight: "800" },
  cardSub: { color: "#991b1b", fontSize: 14, lineHeight: 20 },
});
