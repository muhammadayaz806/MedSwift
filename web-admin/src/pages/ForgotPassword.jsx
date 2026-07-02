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
    <div className="min-h-full flex items-center justify-center p-6 bg-brand-bg">
      <div className="w-full max-w-md rounded-2xl bg-brand-card border border-brand-border shadow-card p-8">
        <h1 className="text-2xl font-bold text-brand-ink">Reset password</h1>
        <p className="text-brand-sub text-sm mt-2">
          Enter your admin email. Firebase will send a password reset link.
        </p>

        {sent ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-emerald-400 bg-emerald-950/40 rounded-lg px-3 py-3">
              If an account exists for that email, a reset link has been sent. Check
              your inbox and spam folder.
            </p>
            <Link
              to="/login"
              className="block text-center text-brand-accent font-medium hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
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
            {err && (
              <p className="text-sm text-brand-accent bg-brand-muted/40 rounded-lg px-3 py-2 border border-brand-border">
                {err}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-brand-emergency text-white font-semibold py-3 hover:bg-brand-red transition disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send reset link"}
            </button>
            <p className="text-center text-sm text-brand-sub">
              <Link to="/login" className="text-brand-accent hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
