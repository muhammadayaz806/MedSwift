import React from "react";
import { View, Text, StyleSheet, Pressable, Linking, ScrollView } from "react-native";

export default function SupportScreen() {
  return (
    <ScrollView style={styles.flex} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Support</Text>
      <Text style={styles.body}>
        MedSwift connects you with verified ambulance providers. For life-threatening
        conditions always call your national emergency line first.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Emergency dial</Text>
        <Pressable
          style={styles.callBtn}
          onPress={() => Linking.openURL("tel:1122")}
        >
          <Text style={styles.callLbl}>Call 1122</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tele-health (demo)</Text>
        <Text style={styles.bodySmall}>
          Replace with your institution&apos;s hotline. Reference designs suggested 1123
          for tele-tabeeb style routing.
        </Text>
        <Pressable
          style={[styles.callBtn, { backgroundColor: "#b91c1c", marginTop: 12 }]}
          onPress={() => Linking.openURL("tel:1123")}
        >
          <Text style={styles.callLbl}>Call 1123</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff7f7", padding: 20, paddingTop: 56 },
  title: { color: "#7f1d1d", fontSize: 24, fontWeight: "800", marginBottom: 12 },
  body: { color: "#991b1b", lineHeight: 22 },
  bodySmall: { color: "#b91c1c", lineHeight: 20, marginTop: 8 },
  card: {
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  cardTitle: { color: "#7f1d1d", fontWeight: "700", fontSize: 16 },
  callBtn: {
    marginTop: 12,
    backgroundColor: "#dc2626",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  callLbl: { color: "#fff", fontWeight: "800" },
});
