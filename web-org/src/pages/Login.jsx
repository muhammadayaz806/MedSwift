import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, loading, profile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  if (!loading && profile?.role === "organization") {
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
    <div className="min-h-full flex items-center justify-center p-6 bg-gradient-to-br from-brand-dark to-brand-text">
      <div className="w-full max-w-md rounded-2xl bg-brand-card shadow-card p-8">
        <h1 className="text-2xl font-bold text-brand-text">Organization login</h1>
        <p className="text-brand-sub text-sm mt-2">
          Sign in to manage drivers, ambulances, and live emergencies.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-text">
              Email
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-brand-border bg-brand-card px-3 py-2 text-sm text-brand-text focus:ring-2 focus:ring-brand-accent outline-none"
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
              className="mt-1 w-full rounded-lg border border-brand-border bg-brand-card px-3 py-2 text-sm text-brand-text focus:ring-2 focus:ring-brand-accent outline-none"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {err && (
            <p className="text-sm text-brand-red bg-brand-muted rounded-lg px-3 py-2">
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
          <Link to="/forgot-password" className="text-brand-accent font-medium hover:underline">
            Forgot password?
          </Link>
        </p>
        <p className="text-center text-sm text-brand-sub mt-6">
          New organization?{" "}
          <Link to="/register" className="text-brand-accent font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
