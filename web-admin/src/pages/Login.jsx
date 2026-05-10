import { useState } from "react";
import { Navigate } from "react-router-dom";
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
    <div className="min-h-full flex items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-xl p-8">
        <h1 className="text-2xl font-bold text-white">Super admin</h1>
        <p className="text-slate-400 text-sm mt-2">
          Restricted access. Use credentials provisioned in Firebase Auth +
          Firestore <code className="text-slate-300">role: admin</code>.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-primary-accent"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-primary-accent"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {err && (
            <p className="text-sm text-red-400 bg-red-950/50 rounded-lg px-3 py-2">
              {err}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-xl bg-primary-accent text-white font-semibold py-3 hover:opacity-95 transition"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
