import { Router } from "express";
import { nanoid } from "nanoid";
import { getAuth } from "../config/firebase.js";
import { getDb } from "../config/firebase.js";
import {
  verifyFirebaseToken,
  loadUserProfile,
  requireRole,
} from "../middleware/auth.js";

const router = Router();

router.get(
  "/status",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("organization"),
  async (req, res) => {
    const db = getDb();
    const orgSnap = await db
      .collection("organizations")
      .where("ownerUserId", "==", req.user.uid)
      .limit(1)
      .get();
    if (orgSnap.empty) {
      return res.json({ organization: null });
    }
    const doc = orgSnap.docs[0];
    return res.json({ organization: { id: doc.id, ...doc.data() } });
  }
);

router.post(
  "/driver/add",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("organization"),
  async (req, res) => {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "name, email, password required" });
    }

    const strongPassword = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*_])[ -~_]{8,}$/.test(String(password));
    if (!strongPassword) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, one digit, and one special character (!@#$%^&*_).",
      });
    }

    const db = getDb();
    const orgSnap = await db
      .collection("organizations")
      .where("ownerUserId", "==", req.user.uid)
      .limit(1)
      .get();

    if (orgSnap.empty) {
      return res.status(400).json({ error: "Organization not linked to user" });
    }
    const orgId = orgSnap.docs[0].id;
    const org = orgSnap.docs[0].data();
    if (!org.verified || org.active === false) {
      return res.status(403).json({ error: "Organization not verified or inactive" });
    }

    let uid;
    try {
      const userRecord = await getAuth().createUser({
        email,
        password,
        displayName: name,
      });
      uid = userRecord.uid;
    } catch (e) {
      return res.status(400).json({ error: e.message || "Auth create failed" });
    }

    try {
      await db.collection("users").doc(uid).set({
        name,
        email,
        role: "driver",
        status: "active",
        reportCount: 0,
        organizationId: orgId,
        createdAt: new Date().toISOString(),
      });

      await db.collection("drivers").doc(uid).set({
        userId: uid,
        orgId,
        status: "active",
        isOnline: false,
        name,
        email,
      });
    } catch (e) {
      try {
        await getAuth().deleteUser(uid);
      } catch {
        /* best-effort rollback */
      }
      return res.status(500).json({
        error: e.message || "Failed to save driver profile",
      });
    }

    return res.json({ ok: true, driverId: uid });
  }
);

router.get(
  "/drivers",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("organization"),
  async (req, res) => {
    const db = getDb();
    const orgSnap = await db
      .collection("organizations")
      .where("ownerUserId", "==", req.user.uid)
      .limit(1)
      .get();
    if (orgSnap.empty) return res.json({ drivers: [] });
    const orgId = orgSnap.docs[0].id;

    const snap = await db.collection("drivers").where("orgId", "==", orgId).get();
    const drivers = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json({ drivers });
  }
);

router.patch(
  "/driver/:id",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("organization"),
  async (req, res) => {
    const { id } = req.params;
    const { status, isOnline } = req.body || {};
    const db = getDb();
    const orgSnap = await db
      .collection("organizations")
      .where("ownerUserId", "==", req.user.uid)
      .limit(1)
      .get();
    if (orgSnap.empty) return res.status(403).json({ error: "No org" });
    const orgId = orgSnap.docs[0].id;

    const dSnap = await db.collection("drivers").doc(id).get();
    if (!dSnap.exists || dSnap.data().orgId !== orgId) {
      return res.status(404).json({ error: "Driver not found" });
    }

    const patch = {};
    if (status === "active" || status === "inactive") patch.status = status;
    if (typeof isOnline === "boolean") patch.isOnline = isOnline;

    await db.collection("drivers").doc(id).update(patch);
    if (patch.status === "inactive") {
      await db.collection("users").doc(id).update({ status: "suspended" });
    } else if (patch.status === "active") {
      await db.collection("users").doc(id).update({ status: "active" });
    }

    return res.json({ ok: true });
  }
);

router.delete(
  "/driver/:id",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("organization"),
  async (req, res) => {
    const { id } = req.params;
    const db = getDb();
    const orgSnap = await db
      .collection("organizations")
      .where("ownerUserId", "==", req.user.uid)
      .limit(1)
      .get();
    if (orgSnap.empty) return res.status(403).json({ error: "No org" });
    const orgId = orgSnap.docs[0].id;

    const dSnap = await db.collection("drivers").doc(id).get();
    if (!dSnap.exists || dSnap.data().orgId !== orgId) {
      return res.status(404).json({ error: "Not found" });
    }

    await db.collection("drivers").doc(id).delete();
    await db.collection("users").doc(id).update({ status: "suspended" });
    try {
      await getAuth().deleteUser(id);
    } catch {
      /* may fail if already deleted */
    }
    return res.json({ ok: true });
  }
);

router.post(
  "/ambulance/add",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("organization"),
  async (req, res) => {
    const { plate, driverId } = req.body || {};
    if (!plate) return res.status(400).json({ error: "plate required" });

    const db = getDb();
    const orgSnap = await db
      .collection("organizations")
      .where("ownerUserId", "==", req.user.uid)
      .limit(1)
      .get();
    if (orgSnap.empty) return res.status(400).json({ error: "No org" });
    const orgId = orgSnap.docs[0].id;

    if (driverId) {
      const dSnap = await db.collection("drivers").doc(driverId).get();
      if (!dSnap.exists || dSnap.data().orgId !== orgId) {
        return res.status(400).json({ error: "Invalid driver" });
      }
    }

    const id = nanoid();
    await db.collection("ambulances").doc(id).set({
      orgId,
      plate,
      driverId: driverId || null,
      createdAt: new Date().toISOString(),
    });

    return res.json({ ok: true, ambulanceId: id });
  }
);

router.patch(
  "/ambulance/:id",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("organization"),
  async (req, res) => {
    const { id } = req.params;
    const { driverId } = req.body || {};
    const db = getDb();
    const orgSnap = await db
      .collection("organizations")
      .where("ownerUserId", "==", req.user.uid)
      .limit(1)
      .get();
    if (orgSnap.empty) return res.status(403).json({ error: "No org" });
    const orgId = orgSnap.docs[0].id;

    const aRef = db.collection("ambulances").doc(id);
    const aSnap = await aRef.get();
    if (!aSnap.exists || aSnap.data().orgId !== orgId) {
      return res.status(404).json({ error: "Not found" });
    }

    if (driverId) {
      const dSnap = await db.collection("drivers").doc(driverId).get();
      if (!dSnap.exists || dSnap.data().orgId !== orgId) {
        return res.status(400).json({ error: "Invalid driver" });
      }
    }

    await aRef.update({ driverId: driverId ?? null });
    return res.json({ ok: true });
  }
);

router.get(
  "/ambulances",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("organization"),
  async (req, res) => {
    const db = getDb();
    const orgSnap = await db
      .collection("organizations")
      .where("ownerUserId", "==", req.user.uid)
      .limit(1)
      .get();
    if (orgSnap.empty) return res.json({ ambulances: [] });
    const orgId = orgSnap.docs[0].id;

    const snap = await db
      .collection("ambulances")
      .where("orgId", "==", orgId)
      .get();
    return res.json({
      ambulances: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    });
  }
);

router.get(
  "/emergencies/active",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("organization"),
  async (req, res) => {
    const db = getDb();
    const orgSnap = await db
      .collection("organizations")
      .where("ownerUserId", "==", req.user.uid)
      .limit(1)
      .get();
    if (orgSnap.empty) return res.json({ emergencies: [] });
    const orgId = orgSnap.docs[0].id;

    const accepted = await db
      .collection("requests")
      .where("organizationId", "==", orgId)
      .where("status", "==", "accepted")
      .get();

    const pending = await db
      .collection("requests")
      .where("status", "==", "pending")
      .limit(50)
      .get();

    const list = [
      ...accepted.docs.map((d) => ({ id: d.id, ...d.data() })),
      ...pending.docs.map((d) => ({ id: d.id, ...d.data() })),
    ];

    return res.json({ emergencies: list });
  }
);

router.get(
  "/emergencies/history",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("organization"),
  async (req, res) => {
    const db = getDb();
    const orgSnap = await db
      .collection("organizations")
      .where("ownerUserId", "==", req.user.uid)
      .limit(1)
      .get();
    if (orgSnap.empty) return res.json({ history: [] });
    const orgId = orgSnap.docs[0].id;

    const snap = await db
      .collection("requests")
      .where("organizationId", "==", orgId)
      .limit(200)
      .get();

    const history = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((r) => r.status === "completed")
      .slice(0, 100);

    return res.json({ history });
  }
);

router.get(
  "/reports/false",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("organization"),
  async (req, res) => {
    const db = getDb();
    const orgSnap = await db
      .collection("organizations")
      .where("ownerUserId", "==", req.user.uid)
      .limit(1)
      .get();
    if (orgSnap.empty) return res.json({ reports: [] });
    const orgId = orgSnap.docs[0].id;

    const driversSnap = await db
      .collection("drivers")
      .where("orgId", "==", orgId)
      .get();
    const driverIds = new Set(driversSnap.docs.map((d) => d.id));

    const reportsSnap = await db.collection("falseReports").limit(200).get();
    const reports = reportsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((r) => driverIds.has(r.reporterId));

    return res.json({ reports });
  }
);

export default router;
