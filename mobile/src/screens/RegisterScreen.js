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

export default function RegisterScreen({ navigation }) {
  const { registerUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit() {
    setErr("");
    try {
      await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
      });
    } catch (e) {
      setErr(e.message || "Registration failed");
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
        <Text style={styles.title}>Create citizen account</Text>
        <Text style={styles.sub}>
          Drivers receive credentials from their organization — they should not
          use this form.
        </Text>

        <TextInput
          placeholder="Full name"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={name}
          onChangeText={setName}
        />
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
          placeholder="Password (min 6)"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        {!!err && <Text style={styles.err}>{err}</Text>}

        <Pressable style={styles.primaryBtn} onPress={onSubmit}>
          <Text style={styles.primaryLbl}>Register</Text>
        </Pressable>

        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Back to login</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#0f172a" },
  scroll: { padding: 24, paddingTop: 56, gap: 12 },
  title: { color: "#fff", fontSize: 24, fontWeight: "800" },
  sub: { color: "#94a3b8", marginBottom: 8 },
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
  err: { color: "#fecaca" },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: "#1e4db7",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryLbl: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { color: "#93c5fd", textAlign: "center", marginTop: 16 },
});
