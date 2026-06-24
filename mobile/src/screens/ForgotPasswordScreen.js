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
import { api } from "../lib/api";

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    setErr("");
    setMsg("");
    setBusy(true);
    try {
      await api("/auth/email/otp/send", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), purpose: "password_reset" }),
      });
      setMsg("Verification code sent. Check your email (or backend console in dev).");
      setStep(2);
    } catch (e) {
      setErr(e.message || "Failed to send code");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setErr("");
    setMsg("");
    setBusy(true);
    try {
      const res = await api("/auth/email/otp/verify", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          purpose: "password_reset",
        }),
      });
      setResetToken(res.token);
      setMsg("Code verified. Choose a new password.");
      setStep(3);
    } catch (e) {
      setErr(e.message || "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    setErr("");
    setMsg("");
    setBusy(true);
    try {
      await api("/auth/email/password/reset", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          token: resetToken,
          newPassword,
        }),
      });
      setMsg("Password updated. You can sign in now.");
      setTimeout(() => navigation.navigate("Login", { role: "user" }), 1200);
    } catch (e) {
      setErr(e.message || "Reset failed");
    } finally {
      setBusy(false);
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
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.sub}>
          Enter the email for your citizen account. We will send a 6-digit code.
        </Text>

        {step >= 1 && (
          <TextInput
            placeholder="Email"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            keyboardType="email-address"
            style={[styles.input, step > 1 && styles.inputDisabled]}
            value={email}
            onChangeText={setEmail}
            editable={step === 1}
          />
        )}

        {step >= 2 && (
          <TextInput
            placeholder="6-digit code"
            placeholderTextColor="#94a3b8"
            keyboardType="number-pad"
            maxLength={6}
            style={[styles.input, step > 2 && styles.inputDisabled]}
            value={code}
            onChangeText={setCode}
            editable={step === 2}
          />
        )}

        {step >= 3 && (
          <TextInput
            placeholder="New password (min 6)"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
          />
        )}

        {!!err && <Text style={styles.err}>{err}</Text>}
        {!!msg && <Text style={styles.msg}>{msg}</Text>}

        {step === 1 && (
          <Pressable
            style={[styles.primaryBtn, busy && styles.btnDisabled]}
            onPress={sendCode}
            disabled={busy || !email.trim()}
          >
            <Text style={styles.primaryLbl}>Send code</Text>
          </Pressable>
        )}
        {step === 2 && (
          <Pressable
            style={[styles.primaryBtn, busy && styles.btnDisabled]}
            onPress={verifyCode}
            disabled={busy || code.length < 6}
          >
            <Text style={styles.primaryLbl}>Verify code</Text>
          </Pressable>
        )}
        {step === 3 && (
          <Pressable
            style={[styles.primaryBtn, busy && styles.btnDisabled]}
            onPress={resetPassword}
            disabled={busy || newPassword.length < 6}
          >
            <Text style={styles.primaryLbl}>Update password</Text>
          </Pressable>
        )}

        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Back to sign in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#0f172a" },
  scroll: { padding: 24, paddingTop: 56, gap: 12 },
  title: { color: "#fff", fontSize: 24, fontWeight: "800" },
  sub: { color: "#94a3b8", marginBottom: 8, lineHeight: 22 },
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
  inputDisabled: { opacity: 0.6 },
  err: { color: "#fecaca" },
  msg: { color: "#86efac" },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: "#dc2626",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  primaryLbl: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { color: "#93c5fd", textAlign: "center", marginTop: 16 },
});
