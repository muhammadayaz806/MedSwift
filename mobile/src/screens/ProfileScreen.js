import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function ProfileScreen() {
  const { profile, logout, updateName, deleteAccount } = useAuth();

  // ── Edit Name ──────────────────────────────────────────────────────────────
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameBusy, setNameBusy] = useState(false);
  const [nameErr, setNameErr] = useState("");
  const [nameSuccess, setNameSuccess] = useState(false);

  function startEditName() {
    setNameInput(profile?.name || "");
    setNameErr("");
    setNameSuccess(false);
    setEditingName(true);
  }

  function cancelEditName() {
    setEditingName(false);
    setNameErr("");
  }

  async function saveName() {
    if (!nameInput.trim()) {
      setNameErr("Name cannot be empty.");
      return;
    }
    setNameBusy(true);
    setNameErr("");
    setNameSuccess(false);
    try {
      await updateName(nameInput.trim());
      setNameSuccess(true);
      setEditingName(false);
    } catch (e) {
      setNameErr(e.message || "Failed to update name.");
    } finally {
      setNameBusy(false);
    }
  }

  // ── Delete Account ─────────────────────────────────────────────────────────
  const [delBusy, setDelBusy] = useState(false);

  function confirmDelete() {
    Alert.alert(
      "Deactivate Account",
      "Your account will be suspended. You can request reinstatement later, but it requires super admin approval. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: performDelete,
        },
      ]
    );
  }

  async function performDelete() {
    setDelBusy(true);
    try {
      await deleteAccount();
      // signOut is called inside deleteAccount — navigation resolves automatically
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to deactivate account.");
      setDelBusy(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const isUser = profile?.role === "user";

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Profile</Text>

      {/* ── Info Card ── */}
      <View style={styles.card}>
        {/* Name row */}
        <View style={styles.fieldRow}>
          <View style={styles.fieldLeft}>
            <Text style={styles.label}>Name</Text>
            {editingName ? (
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                placeholder="Your full name"
                placeholderTextColor="#fca5a5"
              />
            ) : (
              <Text style={styles.value}>{profile?.name || "—"}</Text>
            )}
          </View>
          {editingName ? (
            <View style={styles.editActions}>
              <Pressable
                style={[styles.saveBtn, nameBusy && styles.btnDisabled]}
                onPress={saveName}
                disabled={nameBusy}
              >
                {nameBusy ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveLbl}>Save</Text>
                )}
              </Pressable>
              <Pressable style={styles.cancelBtn} onPress={cancelEditName} disabled={nameBusy}>
                <Text style={styles.cancelLbl}>✕</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.editBtn} onPress={startEditName}>
              <Text style={styles.editBtnLbl}>Edit</Text>
            </Pressable>
          )}
        </View>

        {!!nameErr && <Text style={styles.fieldErr}>{nameErr}</Text>}
        {nameSuccess && <Text style={styles.fieldSuccess}>Name updated ✓</Text>}

        <View style={styles.divider} />

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{profile?.email || "—"}</Text>

        <View style={styles.divider} />

        <Text style={styles.label}>Role</Text>
        <Text style={[styles.value, styles.capitalize]}>{profile?.role || "—"}</Text>

        <View style={styles.divider} />

        <Text style={styles.label}>Account Status</Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: profile?.status === "active" ? "#16a34a" : "#dc2626" },
            ]}
          />
          <Text style={[styles.value, styles.capitalize]}>{profile?.status || "—"}</Text>
        </View>
      </View>

      {/* ── Sign Out ── */}
      <Pressable style={styles.signOutBtn} onPress={() => logout()}>
        <Text style={styles.signOutLbl}>Sign out</Text>
      </Pressable>

      {/* ── Deactivate Account (citizens only) ── */}
      {isUser && (
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Text style={styles.dangerSub}>
            Deactivating your account will suspend it immediately. You can request reinstatement,
            which requires super admin approval before you can log in again.
          </Text>
          <Pressable
            style={[styles.deleteBtn, delBusy && styles.btnDisabled]}
            onPress={confirmDelete}
            disabled={delBusy}
          >
            {delBusy ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.deleteLbl}>Deactivate Account</Text>
            )}
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff7f7" },
  scroll: { padding: 20, paddingTop: 56, paddingBottom: 40, gap: 16 },
  title: { color: "#7f1d1d", fontSize: 24, fontWeight: "800" },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
    gap: 4,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldLeft: { flex: 1, marginRight: 8 },
  label: { color: "#b91c1c", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  value: { color: "#7f1d1d", fontSize: 16, marginTop: 2 },
  capitalize: { textTransform: "capitalize" },
  divider: { height: 1, backgroundColor: "#fce7e7", marginVertical: 10 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  // Inline edit name
  nameInput: {
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: "#7f1d1d",
    fontSize: 16,
    marginTop: 2,
    backgroundColor: "#fff7f7",
  },
  editActions: { flexDirection: "row", gap: 6, alignItems: "center" },
  saveBtn: {
    backgroundColor: "#dc2626",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    minWidth: 52,
    alignItems: "center",
  },
  saveLbl: { color: "#fff", fontWeight: "700", fontSize: 13 },
  cancelBtn: {
    backgroundColor: "#fce7e7",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  cancelLbl: { color: "#b91c1c", fontWeight: "700", fontSize: 14 },
  editBtn: {
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editBtnLbl: { color: "#dc2626", fontWeight: "700", fontSize: 13 },
  fieldErr: { color: "#b91c1c", fontSize: 12, fontWeight: "600", marginTop: 2 },
  fieldSuccess: { color: "#16a34a", fontSize: 12, fontWeight: "600", marginTop: 2 },

  // Buttons
  btnDisabled: { opacity: 0.6 },
  signOutBtn: {
    backgroundColor: "#dc2626",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  signOutLbl: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // Danger zone
  dangerZone: {
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#fff",
    gap: 8,
  },
  dangerTitle: { color: "#991b1b", fontWeight: "800", fontSize: 14, textTransform: "uppercase" },
  dangerSub: { color: "#b91c1c", fontSize: 13, lineHeight: 19 },
  deleteBtn: {
    backgroundColor: "#7f1d1d",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  deleteLbl: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
