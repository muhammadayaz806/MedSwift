import { Router } from "express";
import { getDb } from "../config/firebase.js";
import { verifyFirebaseToken } from "../middleware/auth.js";
import { consumeVerificationToken } from "../services/otp.js";
import { cleanString } from "../utils/validate.js";

const router = Router();

/** Register profile after Firebase Auth signup (all roles use this once). */
router.post("/profile/bootstrap", verifyFirebaseToken, async (req, res) => {
  const {
    name,
    role,
    organizationName,
    organizationEmail,
    emailVerificationToken,
  } = req.body || {};
  if (!name || !role) {
    return res.status(400).json({ error: "name and role required" });
  }

  const allowed = ["user", "organization"];
  if (!allowed.includes(role)) {
    return res
      .status(400)
      .json({ error: "role must be user or organization for signup" });
  }

  const cleanName = cleanString(name, { maxLength: 200, fieldName: "name" });
  if (!cleanName) {
    return res.status(400).json({ error: "name is required" });
  }

  const db = getDb();
  const uid = req.user.uid;
  const email = cleanString(req.user.email || req.body.email || "", {
    maxLength: 320,
    fieldName: "email",
  });

  const ref = db.collection("users").doc(uid);
  const existing = await ref.get();
  if (existing.exists) {
    const data = existing.data();
    // Account was soft-deleted by the user — block re-registration and prompt unsuspend
    if (data.status === "suspended_by_user") {
      return res.status(403).json({
        error:
          "This account has been deactivated. Please request reinstatement to log in again.",
        suspendedByUser: true,
        uid,
        email: data.email || email,
      });
    }
    return res.json({ ok: true, profile: { id: uid, ...data } });
  }

  if (role === "user") {
    if (!emailVerificationToken) {
      return res.status(400).json({
        error:
          "Email verification required. Complete OTP verification before registering.",
      });
    }
    try {
      await consumeVerificationToken(
        emailVerificationToken,
        email,
        "registration",
      );
    } catch (e) {
      return res
        .status(400)
        .json({ error: e.message || "Invalid email verification" });
    }

    await ref.set({
      name: cleanName,
      email,
      role: "user",
      status: "active",
      reportCount: 0,
      organizationId: null,
      createdAt: new Date().toISOString(),
    });
    return res.json({
      ok: true,
      profile: {
        id: uid,
        name: cleanName,
        email,
        role: "user",
        status: "active",
        reportCount: 0,
      },
    });
  }

  if (role === "organization") {
    if (!organizationName || !organizationEmail) {
      return res
        .status(400)
        .json({ error: "organizationName and organizationEmail required" });
    }
    const cleanOrgName = cleanString(organizationName, {
      maxLength: 200,
      fieldName: "organizationName",
    });
    const cleanOrgEmail = cleanString(organizationEmail, {
      maxLength: 320,
      fieldName: "organizationEmail",
    }).toLowerCase();
    if (!cleanOrgName || !cleanOrgEmail || !cleanOrgEmail.includes("@")) {
      return res.status(400).json({
        error: "A valid organizationName and organizationEmail are required",
      });
    }

    await ref.set({
      name: cleanName,
      email,
      role: "organization",
      status: "active",
      reportCount: 0,
      organizationId: null,
      createdAt: new Date().toISOString(),
    });

    const orgRef = await db.collection("organizations").add({
      name: cleanOrgName,
      email: cleanOrgEmail,
      verified: false,
      active: false,
      ownerUserId: uid,
      createdAt: new Date().toISOString(),
    });

    await ref.update({ organizationId: orgRef.id });

    return res.json({
      ok: true,
      profile: {
        id: uid,
        name: cleanName,
        email,
        role: "organization",
        organizationId: orgRef.id,
      },
      organizationId: orgRef.id,
    });
  }

  return res.status(400).json({ error: "Invalid role" });
});

router.patch("/profile/fcm", verifyFirebaseToken, async (req, res) => {
  const { token } = req.body || {};
  const cleanToken = cleanString(token, {
    maxLength: 4096,
    fieldName: "token",
    allowEmoji: true,
  });
  if (!cleanToken) return res.status(400).json({ error: "token required" });

  const db = getDb();
  await db
    .collection("users")
    .doc(req.user.uid)
    .update({ fcmToken: cleanToken });
  return res.json({ ok: true });
});

router.get("/profile/me", verifyFirebaseToken, async (req, res) => {
  const db = getDb();
  const uid = req.user.uid;
  const snap = await db.collection("users").doc(uid).get();
  if (snap.exists) {
    return res.json({ id: snap.id, ...snap.data() });
  }

  /** Drivers created via org dashboard should always have users/{uid}; heal gaps. */
  const driverSnap = await db.collection("drivers").doc(uid).get();
  if (!driverSnap.exists) {
    return res.status(404).json({ error: "Profile not found" });
  }
  const d = driverSnap.data();
  const profile = {
    name: d.name || req.user.name || "",
    email: d.email || req.user.email || "",
    role: "driver",
    status: d.status || "active",
    reportCount: 0,
    organizationId: d.orgId ?? null,
    createdAt: new Date().toISOString(),
  };
  await db.collection("users").doc(uid).set(profile);
  return res.json({ id: uid, ...profile });
});

/** Update the authenticated user's display name (citizens and drivers). */
router.patch("/profile/name", verifyFirebaseToken, async (req, res) => {
  const { name } = req.body || {};
  const trimmed = cleanString(name, { maxLength: 200, fieldName: "name" });
  if (!trimmed) {
    return res.status(400).json({ error: "name is required" });
  }
  const db = getDb();
  const uid = req.user.uid;
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    return res.status(404).json({ error: "Profile not found" });
  }
  await ref.update({ name: trimmed });
  return res.json({ ok: true, name: trimmed });
});

/**
 * Soft-delete: mark account as suspended_by_user.
 * Only allowed for role === "user" (citizens). Account is NOT deleted from Firebase Auth.
 */
router.delete("/profile/me", verifyFirebaseToken, async (req, res) => {
  const db = getDb();
  const uid = req.user.uid;
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    return res.status(404).json({ error: "Profile not found" });
  }
  const data = snap.data();
  if (data.role !== "user") {
    return res
      .status(403)
      .json({ error: "Only citizen accounts can be self-deactivated" });
  }
  await ref.update({
    status: "suspended_by_user",
    suspendedAt: new Date().toISOString(),
  });
  return res.json({ ok: true });
});

/**
 * Submit an unsuspend / reinstatement request.
 * Does NOT use loadUserProfile middleware because the account is suspended.
 * Creates a doc in "unsuspendRequests" for the super admin to review.
 */
router.post(
  "/profile/request-unsuspend",
  verifyFirebaseToken,
  async (req, res) => {
    const db = getDb();
    const uid = req.user.uid;
    const email = req.user.email || "";

    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: "Profile not found" });
    }
    const userData = userSnap.data();
    if (userData.status !== "suspended_by_user") {
      return res
        .status(400)
        .json({ error: "Account is not in a deactivated state" });
    }

    // Avoid duplicates — return existing pending/approved request
    const existing = await db
      .collection("unsuspendRequests")
      .where("uid", "==", uid)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (!existing.empty) {
      const existingData = existing.docs[0].data();
      return res.json({
        ok: true,
        requestId: existing.docs[0].id,
        status: existingData.status,
        alreadyExists: true,
      });
    }

    const reqRef = await db.collection("unsuspendRequests").add({
      uid,
      email,
      name: userData.name || "",
      status: "pending",
      requestedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewNote: null,
    });

    return res.json({ ok: true, requestId: reqRef.id, status: "pending" });
  },
);

/** Check the current unsuspend request status for the calling user. */
/** Check the current unsuspend request status for the calling user. */
router.get("/profile/unsuspend-status", verifyFirebaseToken, async (req, res) => {
  const db = getDb();
  const uid = req.user.uid;

  const userSnap = await db.collection("users").doc(uid).get();
  const userStatus = userSnap.exists ? userSnap.data().status : null;

  // Fetch all of this user's requests before sorting for the most recent —
  // capping this BEFORE sorting (the previous limit(5)) could silently
  // exclude the actual newest request once a user has cycled through
  // deactivation/reinstatement more than a few times, showing a stale
  // status instead. 200 is a generous safety cap, not a realistic ceiling.
  const snap = await db
    .collection("unsuspendRequests")
    .where("uid", "==", uid)
    .limit(200)
    .get();

  if (snap.empty) {
    return res.json({ exists: false });
  }

  // Pick the most recent request
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  docs.sort((a, b) => (b.requestedAt || "").localeCompare(a.requestedAt || ""));
  const latest = docs[0];

  // A resolved request (approved/rejected) only reflects a PAST episode.
  // If the account is currently deactivated again, that old resolution is
  // stale and must not be shown as if it's current — otherwise the app
  // hides the "request again" button behind a misleading "already
  // approved" message. Treat this as "no active request", so the screen
  // correctly offers a fresh submission instead.
  if (latest.status !== "pending" && userStatus === "suspended_by_user") {
    return res.json({ exists: false });
  }

  return res.json({ exists: true, requestId: latest.id, ...latest });
});

/** Check if a given email is associated with a deactivated/suspended user account (Public). */
router.get("/profile/is-suspended", async (req, res) => {
  const email = String(req.query.email || "")
    .trim()
    .toLowerCase();
  if (!email) {
    return res.status(400).json({ error: "email parameter is required" });
  }

  const db = getDb();
  const snap = await db
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();

  if (snap.empty) {
    return res.json({ suspended: false });
  }

  const data = snap.docs[0].data();
  return res.json({
    suspended: data.status === "suspended_by_user",
  });
});

export default router;
