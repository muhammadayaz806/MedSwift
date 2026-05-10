import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit() {
    setErr("");
    try {
      await login(email.trim(), password);
    } catch (e) {
      setErr(e.message || "Login failed");
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.brand}>MedSwift</Text>
        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.sub}>
          Citizen & driver accounts use the same login screen.
        </Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        {!!err && <Text style={styles.err}>{err}</Text>}

        <Pressable style={styles.primaryBtn} onPress={onSubmit}>
          <Text style={styles.primaryLbl}>Continue</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate("Register")}>
          <Text style={styles.link}>New user? Create account</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#0f172a" },
  scroll: {
    padding: 24,
    paddingTop: 72,
    gap: 12,
  },
  brand: {
    color: "#93c5fd",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 8 },
  sub: { color: "#94a3b8", marginBottom: 16 },
  input: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  err: { color: "#fecaca", marginTop: 4 },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: "#dc2626",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryLbl: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: {
    color: "#93c5fd",
    textAlign: "center",
    marginTop: 16,
    fontSize: 15,
  },
});
