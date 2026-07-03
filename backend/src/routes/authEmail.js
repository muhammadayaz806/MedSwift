import { Router } from "express";
import { getAuth } from "firebase-admin/auth";
import { getDb } from "../config/firebase.js";
import { isEmailConfigured } from "../services/email.js";
import { sendOtp, verifyOtp, consumeVerificationToken } from "../services/otp.js";

const router = Router();

router.get("/email/status", (_req, res) => {
  res.json({
    configured: isEmailConfigured(),
    mockInDev: process.env.EMAIL_MOCK === "true" || process.env.NODE_ENV === "development",
  });
});

/** Send a 6-digit OTP to an email address. */
router.post("/email/otp/send", async (req, res) => {
  try {
    const { email, purpose } = req.body || {};
    if (!email || !purpose) {
      return res.status(400).json({ error: "email and purpose required" });
    }
    const result = await sendOtp(email, purpose);
    return res.json(result);
  } catch (e) {
    const status = e.status || 500;
    return res.status(status).json({ error: e.message || "Failed to send code" });
  }
});

/** Verify OTP and receive a short-lived token for the next step. */
router.post("/email/otp/verify", async (req, res) => {
  try {
    const { email, code, purpose } = req.body || {};
    if (!email || !code || !purpose) {
      return res.status(400).json({ error: "email, code, and purpose required" });
    }
    const result = await verifyOtp(email, code, purpose);
    return res.json(result);
  } catch (e) {
    const status = e.status || 500;
    return res.status(status).json({ error: e.message || "Verification failed" });
  }
});

/**
 * Reset password after OTP verification (citizens & org accounts).
 * Drivers should contact their organization instead.
 */
router.post("/email/password/reset", async (req, res) => {
  try {
    const { email, token, newPassword } = req.body || {};
    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: "email, token, and newPassword required" });
    }
    const strongPassword = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*_])[ -~_]{8,}$/.test(String(newPassword));
    if (!strongPassword) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, one digit, and one special character (!@#$%^&*_).",
      });
    }

    await consumeVerificationToken(token, email, "password_reset");

    const normalized = String(email).trim().toLowerCase();
    const auth = getAuth();
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(normalized);
    } catch {
      return res.status(404).json({ error: "No account found for this email" });
    }

    const db = getDb();
    const userSnap = await db.collection("users").doc(userRecord.uid).get();
    if (userSnap.exists && userSnap.data().role === "driver") {
      return res.status(403).json({
        error: "Driver passwords are managed by your organization. Contact them to reset.",
      });
    }

    await auth.updateUser(userRecord.uid, { password: newPassword });

    return res.json({ ok: true });
  } catch (e) {
    const status = e.status || 500;
    return res.status(status).json({ error: e.message || "Password reset failed" });
  }
});

export default router;
