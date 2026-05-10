import { Router } from "express";
import { getDb } from "../config/firebase.js";
import { verifyFirebaseToken } from "../middleware/auth.js";

const router = Router();

/** Register profile after Firebase Auth signup (all roles use this once). */
router.post("/profile/bootstrap", verifyFirebaseToken, async (req, res) => {
  const { name, role, organizationName, organizationEmail } = req.body || {};
  if (!name || !role) {
    return res.status(400).json({ error: "name and role required" });
  }

  const allowed = ["user", "organization"];
  if (!allowed.includes(role)) {
    return res.status(400).json({ error: "role must be user or organization for signup" });
  }

  const db = getDb();
  const uid = req.user.uid;
  const email = req.user.email || req.body.email || "";

  const ref = db.collection("users").doc(uid);
  const existing = await ref.get();
  if (existing.exists) {
    return res.json({ ok: true, profile: { id: uid, ...existing.data() } });
  }

  if (role === "user") {
    await ref.set({
      name,
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
        name,
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

    await ref.set({
      name,
      email,
      role: "organization",
      status: "active",
      reportCount: 0,
      organizationId: null,
      createdAt: new Date().toISOString(),
    });

    const orgRef = await db.collection("organizations").add({
      name: organizationName,
      email: organizationEmail,
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
        name,
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
  if (!token) return res.status(400).json({ error: "token required" });

  const db = getDb();
  await db.collection("users").doc(req.user.uid).update({ fcmToken: token });
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

export default router;
