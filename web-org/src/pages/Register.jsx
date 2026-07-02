import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { registerOrg, loading, profile, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [err, setErr] = useState("");

  if (!loading && profile?.role === "organization") {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      await registerOrg({
        name,
        email,
        password,
        organizationName: orgName,
        organizationEmail: orgEmail,
      });
      await refreshProfile();
    } catch (ex) {
      setErr(ex.message || "Registration failed");
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center p-6 bg-brand-bg">
      <div className="w-full max-w-lg rounded-2xl bg-brand-card border border-brand-border shadow-card p-8">
        <h1 className="text-2xl font-bold text-brand-text">
          Register organization
        </h1>
        <p className="text-brand-sub text-sm mt-2">
          After signup, a super admin must approve your organization before you
          can operate.
        </p>
        <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-brand-text">
              Your full name
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-brand-border bg-brand-card px-3 py-2 text-sm text-brand-text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text">
              Login email
            </label>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-brand-border bg-brand-card px-3 py-2 text-sm text-brand-text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text">
              Password
            </label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-brand-border bg-brand-card px-3 py-2 text-sm text-brand-text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-brand-text">
              Organization name
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-brand-border bg-brand-card px-3 py-2 text-sm text-brand-text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-brand-text">
              Organization contact email
            </label>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-brand-border bg-brand-card px-3 py-2 text-sm text-brand-text"
              value={orgEmail}
              onChange={(e) => setOrgEmail(e.target.value)}
              required
            />
          </div>
          {err && (
            <p className="sm:col-span-2 text-sm text-brand-red bg-brand-muted rounded-lg px-3 py-2">
              {err}
            </p>
          )}
          <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-brand-emergency text-white font-semibold py-3 hover:bg-brand-red transition"
            >
              Create account
            </button>
            <Link
              to="/login"
              className="flex-1 text-center rounded-xl border border-brand-border font-semibold py-3 text-brand-text hover:bg-brand-surface transition"
            >
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
