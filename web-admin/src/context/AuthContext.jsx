import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
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

  const logout = useCallback(() => signOut(auth), []);

  const getToken = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) throw new Error("Not signed in");
    return u.getIdToken();
  }, []);

  const value = useMemo(
    () => ({ user, profile, loading, login, logout, getToken }),
    [user, profile, loading, login, logout, getToken]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth outside provider");
  return v;
}
