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
    <div className="min-h-full flex items-center justify-center p-6 bg-slate-100">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg p-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Register organization
        </h1>
        <p className="text-slate-600 text-sm mt-2">
          After signup, a super admin must approve your organization before you
          can operate.
        </p>
        <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Your full name
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Login email
            </label>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Organization name
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Organization contact email
            </label>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={orgEmail}
              onChange={(e) => setOrgEmail(e.target.value)}
              required
            />
          </div>
          {err && (
            <p className="sm:col-span-2 text-sm text-emergency bg-red-50 rounded-lg px-3 py-2">
              {err}
            </p>
          )}
          <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-primary text-white font-semibold py-3"
            >
              Create account
            </button>
            <Link
              to="/login"
              className="flex-1 text-center rounded-xl border border-slate-300 font-semibold py-3 text-slate-700"
            >
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
