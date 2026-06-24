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

const ROLE_COPY = {
  user: {
    title: "Sign in as citizen",
    sub: "Access emergency requests and live ambulance tracking.",
    showRegister: true,
    showForgot: true,
  },
  driver: {
    title: "Sign in as driver",
    sub: "Use credentials provided by your organization.",
    showRegister: false,
    showForgot: false,
  },
};

export default function LoginScreen({ navigation, route }) {
  const role = route.params?.role || "user";
  const copy = ROLE_COPY[role] || ROLE_COPY.user;
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
        <Pressable onPress={() => navigation.navigate("RoleSelection")}>
          <Text style={styles.back}>← Change account type</Text>
        </Pressable>

        <Text style={styles.brand}>MedSwift</Text>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.sub}>{copy.sub}</Text>

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

        {copy.showForgot && (
          <Pressable onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={styles.forgot}>Forgot password?</Text>
          </Pressable>
        )}

        {!!err && <Text style={styles.err}>{err}</Text>}

        <Pressable style={styles.primaryBtn} onPress={onSubmit}>
          <Text style={styles.primaryLbl}>Continue</Text>
        </Pressable>

        {copy.showRegister && (
          <Pressable onPress={() => navigation.navigate("Register")}>
            <Text style={styles.link}>New user? Create account</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#0f172a" },
  scroll: {
    padding: 24,
    paddingTop: 48,
    gap: 12,
  },
  back: { color: "#64748b", fontSize: 14, marginBottom: 8 },
  brand: {
    color: "#93c5fd",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 8 },
  sub: { color: "#94a3b8", marginBottom: 16, lineHeight: 22 },
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
  forgot: {
    color: "#93c5fd",
    textAlign: "right",
    fontSize: 14,
    marginTop: -4,
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
