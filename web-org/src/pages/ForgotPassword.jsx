import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*_]).{8,}$/;
const PASSWORD_HINT =
  "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 digit, and 1 special character (!@#$%^&*_).";


function validatePassword(pw) {
  return PASSWORD_REGEX.test(pw) ? "" : PASSWORD_HINT;
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [pwErr, setPwErr] = useState("");

  async function sendCode(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setBusy(true);
    try {
      await api("/auth/email/otp/send", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), purpose: "password_reset" }),
      });
      setMsg("Verification code sent. Check your email.");
      setStep(2);
    } catch (ex) {
      setErr(ex.message || "Failed to send code");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setBusy(true);
    try {
      const res = await api("/auth/email/otp/verify", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          purpose: "password_reset",
        }),
      });
      setResetToken(res.token);
      setMsg("Code verified. Choose a new password.");
      setStep(3);
    } catch (ex) {
      setErr(ex.message || "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    const validationError = validatePassword(newPassword);
    if (validationError) {
      setErr(validationError);
      return;
    }
    setBusy(true);
    try {
      await api("/auth/email/password/reset", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          token: resetToken,
          newPassword,
        }),
      });
      setMsg("Password updated! Redirecting to login…");
      setTimeout(() => navigate("/login"), 1500);
    } catch (ex) {
      setErr(ex.message || "Password reset failed");
    } finally {
      setBusy(false);
    }
  }

  const stepTitles = ["Reset password", "Enter verification code", "Set new password"];

  return (
    <div className="min-h-full flex items-center justify-center p-6 bg-gradient-to-br from-brand-dark to-brand-text">
      <div className="w-full max-w-md rounded-2xl bg-brand-card shadow-card p-8">
        <h1 className="text-2xl font-bold text-brand-text">{stepTitles[step - 1]}</h1>
        <p className="text-brand-sub text-sm mt-2">
          {step === 1 && "Enter your organization account email. We will send a 6-digit code."}
          {step === 2 && `A 6-digit code was sent to ${email}.`}
          {step === 3 && "Choose a strong new password for your account."}
        </p>

        {/* Step 1 — Email */}
        {step === 1 && (
          <form onSubmit={sendCode} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-text">Email</label>
              <input
                className="mt-1 w-full rounded-lg border border-brand-border bg-brand-card px-3 py-2 text-sm text-brand-text focus:ring-2 focus:ring-brand-accent outline-none"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            {err && <p className="text-sm text-brand-red bg-brand-muted rounded-lg px-3 py-2">{err}</p>}
            {msg && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{msg}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-brand-emergency text-white font-semibold py-3 hover:bg-brand-red transition disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send verification code"}
            </button>
            <p className="text-center text-sm text-brand-sub">
              <Link to="/login" className="text-brand-accent font-medium hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}

        {/* Step 2 — OTP */}
        {step === 2 && (
          <form onSubmit={verifyCode} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-text">6-digit code</label>
              <input
                className="mt-1 w-full rounded-lg border border-brand-border bg-brand-card px-3 py-2 text-sm text-brand-text focus:ring-2 focus:ring-brand-accent outline-none tracking-widest text-center"
                type="text"
                inputMode="numeric"
                maxLength={6}
                pattern="\d{6}"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
                autoComplete="one-time-code"
              />
            </div>
            {err && <p className="text-sm text-brand-red bg-brand-muted rounded-lg px-3 py-2">{err}</p>}
            {msg && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{msg}</p>}
            <button
              type="submit"
              disabled={busy || code.length < 6}
              className="w-full rounded-xl bg-brand-emergency text-white font-semibold py-3 hover:bg-brand-red transition disabled:opacity-60"
            >
              {busy ? "Verifying…" : "Verify code"}
            </button>
            <button
              type="button"
              onClick={() => { setStep(1); setCode(""); setErr(""); setMsg(""); }}
              className="w-full text-center text-sm text-brand-accent font-medium hover:underline"
            >
              ← Use a different email
            </button>
          </form>
        )}

        {/* Step 3 — New password */}
        {step === 3 && (
          <form onSubmit={resetPassword} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-text">New password</label>
              <input
                className="mt-1 w-full rounded-lg border border-brand-border bg-brand-card px-3 py-2 text-sm text-brand-text focus:ring-2 focus:ring-brand-accent outline-none"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPwErr(validatePassword(e.target.value));
                }}
                required
                minLength={8}
                autoComplete="new-password"
              />
              {pwErr && newPassword && (
                <p className="mt-1 text-xs text-brand-red">{pwErr}</p>
              )}
            </div>
            {err && <p className="text-sm text-brand-red bg-brand-muted rounded-lg px-3 py-2">{err}</p>}
            {msg && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{msg}</p>}
            <button
              type="submit"
              disabled={busy || !!validatePassword(newPassword)}
              className="w-full rounded-xl bg-brand-emergency text-white font-semibold py-3 hover:bg-brand-red transition disabled:opacity-60"
            >
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
