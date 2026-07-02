import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, loading, profile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  if (!loading && profile?.role === "admin") {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      await login(email, password);
    } catch (ex) {
      setErr(ex.message || "Login failed");
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center p-6 bg-brand-bg">
      <div className="w-full max-w-md rounded-2xl bg-brand-card border border-brand-border shadow-card p-8">
        <h1 className="text-2xl font-bold text-brand-ink">Super admin</h1>
        <p className="text-brand-sub text-sm mt-2">
          Restricted access. Use credentials provisioned in Firebase Auth +
          Firestore <code className="text-brand-soft">role: admin</code>.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-text">
              Email
            </label>
            <input
              className="mt-1 w-full rounded-lg bg-brand-bg border border-brand-border px-3 py-2 text-sm text-brand-ink outline-none focus:ring-2 focus:ring-brand-accent"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text">
              Password
            </label>
            <input
              className="mt-1 w-full rounded-lg bg-brand-bg border border-brand-border px-3 py-2 text-sm text-brand-ink outline-none focus:ring-2 focus:ring-brand-accent"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {err && (
            <p className="text-sm text-brand-accent bg-brand-muted/40 rounded-lg px-3 py-2 border border-brand-border">
              {err}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-xl bg-brand-emergency text-white font-semibold py-3 hover:bg-brand-red transition"
          >
            Sign in
          </button>
        </form>
        <p className="text-center text-sm text-brand-sub mt-4">
          <Link to="/forgot-password" className="text-brand-accent hover:underline">
            Forgot password?
          </Link>
        </p>
      </div>
    </div>
  );
}
