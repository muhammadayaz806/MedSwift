import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { api } from "../lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
        return;
      }
      try {
        const token = await u.getIdToken();
        const me = await api("/auth/profile/me", { method: "GET" }, token);
        setProfile(me);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const login = useCallback(async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const registerOrg = useCallback(
    async ({ name, email, password, organizationName, organizationEmail }) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken();
      await api(
        "/auth/profile/bootstrap",
        {
          method: "POST",
          body: JSON.stringify({
            name,
            role: "organization",
            organizationName,
            organizationEmail,
            email,
          }),
        },
        token
      );
    },
    []
  );

  const logout = useCallback(() => signOut(auth), []);

  const refreshProfile = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) return;
    const token = await u.getIdToken();
    const me = await api("/auth/profile/me", { method: "GET" }, token);
    setProfile(me);
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
      loading,
      login,
      logout,
      registerOrg,
      refreshProfile,
      getToken,
    }),
    [user, profile, loading, login, logout, registerOrg, refreshProfile, getToken]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth outside provider");
  return v;
}
