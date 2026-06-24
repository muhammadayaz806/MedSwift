import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ForgotPassword() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (ex) {
      setErr(ex.message || "Could not send reset email");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center p-6 bg-gradient-to-br from-primary to-primary-dark">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-8">
        <h1 className="text-2xl font-bold text-slate-900">Reset password</h1>
        <p className="text-slate-600 text-sm mt-2">
          Enter your organization account email. We will send a reset link.
        </p>

        {sent ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-3">
              If an account exists for that email, a reset link has been sent. Check
              your inbox and spam folder.
            </p>
            <Link
              to="/login"
              className="block text-center text-primary font-medium hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            {err && (
              <p className="text-sm text-emergency bg-red-50 rounded-lg px-3 py-2">
                {err}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-primary text-white font-semibold py-3 hover:bg-primary-dark transition disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send reset link"}
            </button>
            <p className="text-center text-sm text-slate-500">
              <Link to="/login" className="text-primary font-medium hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
