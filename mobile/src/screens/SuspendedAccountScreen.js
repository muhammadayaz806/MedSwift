import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

/**
 * SuspendedAccountScreen
 *
 * Shown when a user tries to re-register but their account is suspended_by_user.
 * The user can:
 *   1. Submit an unsuspend / reinstatement request (requires they still have
 *      a valid Firebase Auth session — they were signed in during re-registration).
 *   2. See the current status of their request (pending / approved / rejected).
 *   3. Navigate back to Login once approved.
 *
 * Route params: { uid, email, idToken }
 */
export default function SuspendedAccountScreen({ navigation, route }) {
  const { uid: paramUid, email: paramEmail, idToken: paramIdToken } = route.params || {};
  const { user: authUser, logout: authLogout, getToken } = useAuth();

  const [status, setStatus] = useState(null);   // null | "pending" | "approved" | "rejected"
  const [requestId, setRequestId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [err, setErr] = useState("");
  const [resolvedToken, setResolvedToken] = useState(paramIdToken || null);

  const activeEmail = paramEmail || authUser?.email || "";
  const activeUid = paramUid || authUser?.uid || "";

  // Resolve ID token from auth context if not in params
  useEffect(() => {
    if (!resolvedToken && authUser) {
      getToken()
        .then((tok) => setResolvedToken(tok))
        .catch(() => setChecking(false));
    }
  }, [resolvedToken, authUser, getToken]);

  // ── Check if a request already exists ─────────────────────────────────────
  const checkStatus = useCallback(async () => {
    const tokenToCheck = resolvedToken;
    if (!tokenToCheck) {
      setChecking(false);
      return;
    }
    setChecking(true);
    try {
      const data = await api("/auth/profile/unsuspend-status", { method: "GET" }, tokenToCheck);
      if (data.exists) {
        setStatus(data.status);
        setRequestId(data.requestId);
      }
    } catch {
      // ignore — treat as no existing request
    } finally {
      setChecking(false);
    }
  }, [resolvedToken]);

  useEffect(() => {
    if (resolvedToken || (!paramIdToken && !authUser)) {
      checkStatus();
    }
  }, [resolvedToken, checkStatus, paramIdToken, authUser]);

  // ── Submit request ─────────────────────────────────────────────────────────
  async function submitRequest() {
    const tokenToUse = resolvedToken;
    if (!tokenToUse) {
      setErr("Session expired. Please go back and sign in again.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const data = await api(
        "/auth/profile/request-unsuspend",
        { method: "POST" },
        tokenToUse
      );
      setStatus(data.status || "pending");
      setRequestId(data.requestId);
    } catch (e) {
      setErr(e.message || "Failed to submit request.");
    } finally {
      setBusy(false);
    }
  }

  // ── Render helpers ─────────────────────────────────────────────────────────
  function StatusBadge() {
    const configs = {
      pending: { bg: "#fef3c7", text: "#92400e", label: "Pending Review" },
      approved: { bg: "#dcfce7", text: "#14532d", label: "Approved ✓" },
      rejected: { bg: "#fee2e2", text: "#7f1d1d", label: "Rejected" },
    };
    const cfg = configs[status] || configs.pending;
    return (
      <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
      {/* Icon */}
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>🔒</Text>
      </View>

      <Text style={styles.title}>Account Deactivated</Text>
      <Text style={styles.sub}>
        The account associated with{" "}
        <Text style={styles.em}>{activeEmail || "this email"}</Text> has been deactivated.
        {"\n\n"}
        To access your account again, you need to submit a reinstatement request. A
        super admin will review it and restore your access once approved.
      </Text>

      {checking ? (
        <ActivityIndicator color="#dc2626" style={{ marginTop: 24 }} />
      ) : status ? (
        /* ── Existing request status ── */
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Reinstatement Request</Text>
          <StatusBadge />
          {status === "pending" && (
            <Text style={styles.statusNote}>
              Your request is under review. You'll be able to log in once the admin approves it.
            </Text>
          )}
          {status === "approved" && (
            <>
              <Text style={styles.statusNote}>
                Your account has been reactivated! You can now log in with your original
                credentials.
              </Text>
              <Pressable
                style={styles.primaryBtn}
                onPress={async () => {
                  if (authUser) {
                    await authLogout();
                  } else {
                    navigation.replace("Login", { role: "user" });
                  }
                }}
              >
                <Text style={styles.primaryLbl}>Go to Login</Text>
              </Pressable>
            </>
          )}
          {status === "rejected" && (
            <>
              <Text style={styles.statusNote}>
                Your reinstatement request was not approved. Please contact support for more
                information.
              </Text>
              <Pressable
                style={styles.ghostBtn}
                onPress={() => navigation.navigate("Support")}
              >
                <Text style={styles.ghostLbl}>Contact Support</Text>
              </Pressable>
            </>
          )}
          <Pressable style={styles.refreshBtn} onPress={checkStatus}>
            <Text style={styles.refreshLbl}>↻ Refresh status</Text>
          </Pressable>
        </View>
      ) : (
        /* ── No request yet — let user submit ── */
        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>Request Reinstatement</Text>
          <Text style={styles.actionSub}>
            Tap below to send a reinstatement request to the super admin. You'll need to wait
            for approval before logging in.
          </Text>
          {!!err && <Text style={styles.err}>{err}</Text>}
          <Pressable
            style={[styles.primaryBtn, busy && styles.btnDisabled]}
            onPress={submitRequest}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryLbl}>Request Reinstatement</Text>
            )}
          </Pressable>
        </View>
      )}

      <Pressable
        style={styles.backLink}
        onPress={async () => {
          if (authUser) {
            await authLogout();
          } else {
            navigation.replace("RoleSelection");
          }
        }}
      >
        <Text style={styles.backLinkText}>
          {authUser ? "← Sign out" : "← Back to home"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff7f7" },
  scroll: {
    padding: 24,
    paddingTop: 64,
    paddingBottom: 48,
    alignItems: "center",
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fce7e7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  icon: { fontSize: 36 },
  title: {
    color: "#7f1d1d",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
  },
  sub: {
    color: "#991b1b",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  em: { fontWeight: "700" },

  // Status card
  statusCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
    gap: 12,
    marginBottom: 16,
  },
  statusTitle: { color: "#7f1d1d", fontWeight: "800", fontSize: 15 },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: { fontWeight: "700", fontSize: 13 },
  statusNote: { color: "#991b1b", fontSize: 14, lineHeight: 20 },
  refreshBtn: { alignSelf: "flex-end" },
  refreshLbl: { color: "#b91c1c", fontSize: 13, fontWeight: "600" },

  // Action card
  actionCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
    gap: 10,
    marginBottom: 16,
  },
  actionTitle: { color: "#7f1d1d", fontWeight: "800", fontSize: 15 },
  actionSub: { color: "#991b1b", fontSize: 14, lineHeight: 20 },
  err: { color: "#b91c1c", fontWeight: "600", fontSize: 13 },

  // Buttons
  primaryBtn: {
    backgroundColor: "#dc2626",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#dc2626",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  primaryLbl: { color: "#fff", fontWeight: "900", fontSize: 15 },
  ghostBtn: {
    borderWidth: 1,
    borderColor: "#dc2626",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  ghostLbl: { color: "#dc2626", fontWeight: "700", fontSize: 14 },
  btnDisabled: { opacity: 0.6 },

  // Back link
  backLink: { marginTop: 8 },
  backLinkText: { color: "#b91c1c", fontWeight: "600", fontSize: 14 },
});
