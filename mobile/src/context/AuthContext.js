import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { api } from "../lib/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const AuthCtx = createContext(null);

async function registerPushTokenAsync() {
  // Remote push tokens are not supported in Expo Go (SDK 53+).
  if (Constants.appOwnership === "expo") return null;
  if (!Device.isDevice) return null;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    const tok = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return tok.data;
  } catch {
    try {
      const tok = await Notifications.getExpoPushTokenAsync();
      return tok.data;
    } catch {
      return null;
    }
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) {
      setProfile(null);
      setProfileError(null);
      return null;
    }
    const token = await u.getIdToken();
    try {
      const me = await api("/auth/profile/me", { method: "GET" }, token);
      setProfile(me);
      setProfileError(null);
      return me;
    } catch (e) {
      // Heal partially registered citizen accounts where auth exists but profile doc is missing.
      if ((e?.message || "").includes("Profile not found")) {
        try {
          await api(
            "/auth/profile/bootstrap",
            {
              method: "POST",
              body: JSON.stringify({
                name: u.displayName || u.email?.split("@")[0] || "Citizen",
                role: "user",
                email: u.email || "",
              }),
            },
            token
          );
          const healed = await api("/auth/profile/me", { method: "GET" }, token);
          setProfile(healed);
          setProfileError(null);
          return healed;
        } catch (healErr) {
          setProfile(null);
          setProfileError(healErr?.message || "Failed to bootstrap profile");
          return null;
        }
      }
      setProfile(null);
      setProfileError(e?.message || "Failed to load profile");
      return null;
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        // Batch: clear everything at once so no intermediate render shows MissingProfile
        setUser(null);
        setProfile(null);
        setProfileError(null);
        setLoading(false);
        return;
      }
      // Keep loading=true while we fetch the profile so RootNavigator
      // stays on the spinner and never flashes <MissingProfile>.
      const me = await refreshProfile();
      // Now reveal the authenticated state all at once
      setUser(u);
      if (me) {
        const pushToken = await registerPushTokenAsync();
        if (pushToken) {
          try {
            const token = await u.getIdToken();
            await api(
              "/auth/profile/fcm",
              {
                method: "PATCH",
                body: JSON.stringify({ token: pushToken }),
              },
              token
            );
          } catch {
            /* optional */
          }
        }
      }
      setLoading(false);
    });
    return unsub;
  }, [refreshProfile]);

  const login = useCallback(async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const registerUser = useCallback(async ({ name, email, password, emailVerificationToken }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const token = await cred.user.getIdToken();
    await api(
      "/auth/profile/bootstrap",
      {
        method: "POST",
        body: JSON.stringify({
          name,
          role: "user",
          email,
          emailVerificationToken,
        }),
      },
      token
    );
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const getToken = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) throw new Error("Not signed in");
    return u.getIdToken();
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      profileError,
      loading,
      login,
      logout,
      registerUser,
      refreshProfile,
      getToken,
    }),
    [
      user,
      profile,
      profileError,
      loading,
      login,
      logout,
      registerUser,
      refreshProfile,
      getToken,
    ]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
