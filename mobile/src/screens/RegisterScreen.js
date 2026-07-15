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

export default function RegisterScreen({ navigation }) {
  const { registerUser } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  function validatePassword(pw) {
    if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*_]).{8,}$/.test(pw)) {
      return "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 digit, and 1 special character (!@#$%^&*_).";
    }
    return "";
  }

  async function sendCode() {
    setErr("");
    setMsg("");
    setBusy(true);
    try {
      const res = await api("/auth/email/otp/send", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), purpose: "registration" }),
      });
      if (res.devCode) {
        setMsg(
          `Email sent to ${email.trim()}. Code: ${res.devCode} (also in backend terminal & spam folder).`
        );
      } else {
        setMsg("Verification code sent. Check your email (and spam folder).");
      }
      setStep(2);
    } catch (e) {
      setErr(e.message || "Failed to send code");
    } finally {
      setBusy(false);
    }
  }

  async function verifyAndContinue() {
    setErr("");
    setMsg("");
    setBusy(true);
    try {
      const res = await api("/auth/email/otp/verify", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          purpose: "registration",
        }),
      });
      setVerificationToken(res.token);
      setMsg("Email verified. Complete your profile.");
      setStep(3);
    } catch (e) {
      setErr(e.message || "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit() {
    setErr("");
    setBusy(true);
    const validationError = validatePassword(password);
    if (validationError) {
      setErr(validationError);
      setBusy(false);
      return;
    }
    try {
      await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
        emailVerificationToken: verificationToken,
      });
    } catch (e) {
      setErr(e.message || "Registration failed");
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
        <Text style={styles.title}>Create citizen account</Text>
        <Text style={styles.sub}>
          Drivers receive credentials from their organization — they should not
          use this form.
        </Text>

        {step >= 1 && (
          <TextInput
            placeholder="Email"
            placeholderTextColor="#fca5a5"
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
            placeholder="6-digit verification code"
            placeholderTextColor="#fca5a5"
            keyboardType="number-pad"
            maxLength={6}
            style={[styles.input, step > 2 && styles.inputDisabled]}
            value={code}
            onChangeText={setCode}
            editable={step === 2}
          />
        )}

        {step >= 3 && (
          <>
            <TextInput
              placeholder="Full name"
              placeholderTextColor="#fca5a5"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#fca5a5"
              secureTextEntry
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />
            {!!validatePassword(password) && !!password && (
              <Text style={styles.pwHint}>{validatePassword(password)}</Text>
            )}
          </>
        )}

        {!!err && <Text style={styles.err}>{err}</Text>}
        {!!msg && <Text style={styles.msg}>{msg}</Text>}

        {step === 1 && (
          <Pressable
            style={[styles.primaryBtn, busy && styles.btnDisabled]}
            onPress={sendCode}
            disabled={busy || !email.trim()}
          >
            <Text style={styles.primaryLbl}>Send verification code</Text>
          </Pressable>
        )}
        {step === 2 && (
          <Pressable
            style={[styles.primaryBtn, busy && styles.btnDisabled]}
            onPress={verifyAndContinue}
            disabled={busy || code.length < 6}
          >
            <Text style={styles.primaryLbl}>Verify email</Text>
          </Pressable>
        )}
        {step === 3 && (
          <Pressable
            style={[styles.primaryBtn, busy && styles.btnDisabled]}
            onPress={onSubmit}
            disabled={busy || !name.trim() || !!validatePassword(password)}
          >
            <Text style={styles.primaryLbl}>Register</Text>
          </Pressable>
        )}

        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Back to login</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff7f7" },
  scroll: { padding: 24, paddingTop: 56, gap: 12 },
  title: { color: "#7f1d1d", fontSize: 24, fontWeight: "900" },
  sub: { color: "#991b1b", marginBottom: 8, lineHeight: 22 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#7f1d1d",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  inputDisabled: { opacity: 0.5 },
  err: { color: "#b91c1c", fontWeight: "600" },
  pwHint: { color: "#b91c1c", fontSize: 12, marginTop: -4 },
  msg: { color: "#15803d", fontWeight: "600" },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: "#ef4444",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#ef4444",
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  btnDisabled: { opacity: 0.6 },
  primaryLbl: { color: "#fff", fontWeight: "900", fontSize: 16 },
  link: { color: "#dc2626", textAlign: "center", marginTop: 16, fontWeight: "700" },
});
