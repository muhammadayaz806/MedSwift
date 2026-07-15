import { Router } from "express";
import { getAuth } from "firebase-admin/auth";
import { getDb } from "../config/firebase.js";
import { isEmailConfigured } from "../services/email.js";
import { sendOtp, verifyOtp, consumeVerificationToken } from "../services/otp.js";

const router = Router();

const ACCOUNT_ROLE_LABELS = {
  user: "citizen",
  driver: "driver",
};

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function resolveAccountRole(email, accountRole) {
  const normalized = normalizeEmail(email);
  if (!ACCOUNT_ROLE_LABELS[accountRole]) {
    throw Object.assign(new Error("Invalid account type"), { status: 400 });
  }

  const auth = getAuth();
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(normalized);
  } catch {
    throw Object.assign(new Error("No account found for this email"), { status: 404 });
  }

  const db = getDb();
  const uid = userRecord.uid;
  const userSnap = await db.collection("users").doc(uid).get();

  if (userSnap.exists && userSnap.data().role === accountRole) {
    return userRecord;
  }

  if (accountRole === "driver") {
    const driverSnap = await db.collection("drivers").doc(uid).get();
    if (driverSnap.exists) {
      if (!userSnap.exists || userSnap.data().role !== "driver") {
        const d = driverSnap.data();
        await db.collection("users").doc(uid).set(
          {
            name: d.name || userRecord.displayName || "",
            email: normalized,
            role: "driver",
            status: d.status || "active",
            reportCount: 0,
            organizationId: d.orgId ?? null,
            createdAt: userSnap.exists
              ? userSnap.data().createdAt || new Date().toISOString()
              : new Date().toISOString(),
          },
          { merge: true }
        );
      }
      return userRecord;
    }
  }

  if (userSnap.exists && userSnap.data().role !== accountRole) {
    throw Object.assign(
      new Error(`No ${ACCOUNT_ROLE_LABELS[accountRole]} account found for this email`),
      { status: 404 }
    );
  }

  throw Object.assign(new Error("No account found for this email"), { status: 404 });
}

router.get("/email/status", (_req, res) => {
  res.json({
    configured: isEmailConfigured(),
    mockInDev: process.env.EMAIL_MOCK === "true" || process.env.NODE_ENV === "development",
  });
});

/** Send a 6-digit OTP to an email address. */
router.post("/email/otp/send", async (req, res) => {
  try {
    const { email, purpose, accountRole } = req.body || {};
    if (!email || !purpose) {
      return res.status(400).json({ error: "email and purpose required" });
    }
    if (accountRole) {
      await resolveAccountRole(email, accountRole);
    }
    const result = await sendOtp(email, purpose);
    console.log("[auth/email/otp/send]", {
      email: normalizeEmail(email),
      purpose,
      accountRole: accountRole || null,
      delivery: result.delivery || null,
      ok: true,
    });
    return res.json(result);
  } catch (e) {
    console.warn("[auth/email/otp/send]", {
      email: normalizeEmail(req.body?.email),
      purpose: req.body?.purpose,
      accountRole: req.body?.accountRole || null,
      error: e.message,
    });
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

/** Reset password after OTP verification (citizens, drivers, and org accounts). */
router.post("/email/password/reset", async (req, res) => {
  try {
    const { email, token, newPassword, purpose, accountRole } = req.body || {};
    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: "email, token, and newPassword required" });
    }
    const resetPurpose = purpose || "password_reset";
    const strongPassword = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*_])[ -~_]{8,}$/.test(String(newPassword));
    if (!strongPassword) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, one digit, and one special character (!@#$%^&*_).",
      });
    }

    await consumeVerificationToken(token, email, resetPurpose);

    let userRecord;
    if (accountRole) {
      userRecord = await resolveAccountRole(email, accountRole);
    } else {
      const normalized = normalizeEmail(email);
      try {
        userRecord = await getAuth().getUserByEmail(normalized);
      } catch {
        return res.status(404).json({ error: "No account found for this email" });
      }
    }

    await getAuth().updateUser(userRecord.uid, { password: newPassword });

    return res.json({ ok: true });
  } catch (e) {
    const status = e.status || 500;
    return res.status(status).json({ error: e.message || "Password reset failed" });
  }
});

export default router;
