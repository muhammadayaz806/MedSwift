import { Router } from "express";
import { getDb } from "../config/firebase.js";
import {
  verifyFirebaseToken,
  loadUserProfile,
  requireRole,
} from "../middleware/auth.js";

const router = Router();

router.get(
  "/organizations",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("admin"),
  async (req, res) => {
    const db = getDb();
    const snap = await db.collection("organizations").limit(500).get();
    return res.json({
      organizations: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    });
  }
);

router.post(
  "/approve",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("admin"),
  async (req, res) => {
    const { orgId, approve } = req.body || {};
    if (!orgId || typeof approve !== "boolean") {
      return res.status(400).json({ error: "orgId and approve (boolean) required" });
    }

    const db = getDb();
    await db.collection("organizations").doc(orgId).update({
      verified: approve,
      active: approve,
      reviewedAt: new Date().toISOString(),
    });

    return res.json({ ok: true });
  }
);

router.post(
  "/suspend-org",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("admin"),
  async (req, res) => {
    const { orgId, active } = req.body || {};
    if (!orgId || typeof active !== "boolean") {
      return res.status(400).json({ error: "orgId and active (boolean) required" });
    }
    const db = getDb();
    await db.collection("organizations").doc(orgId).update({ active });
    return res.json({ ok: true });
  }
);

router.post(
  "/suspend-user",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("admin"),
  async (req, res) => {
    const { userId, suspended } = req.body || {};
    if (!userId || typeof suspended !== "boolean") {
      return res.status(400).json({ error: "userId and suspended required" });
    }

    const db = getDb();
    await db.collection("users").doc(userId).update({
      status: suspended ? "suspended" : "active",
    });

    return res.json({ ok: true });
  }
);

router.get(
  "/users",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("admin"),
  async (req, res) => {
    const db = getDb();
    const snap = await db.collection("users").limit(500).get();
    return res.json({
      users: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    });
  }
);

router.get(
  "/drivers",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("admin"),
  async (req, res) => {
    const db = getDb();
    const [driversSnap, organizationsSnap] = await Promise.all([
      db.collection("drivers").limit(500).get(),
      db.collection("organizations").limit(500).get(),
    ]);

    const organizationNames = {};
    for (const orgDoc of organizationsSnap.docs) {
      const orgData = orgDoc.data() || {};
      organizationNames[orgDoc.id] = orgData.name || "Unknown organization";
    }

    const drivers = driversSnap.docs.map((d) => {
      const data = d.data() || {};
      const orgId = data.orgId;
      return {
        id: d.id,
        ...data,
        organizationName: orgId
          ? organizationNames[orgId] || orgId
          : "No organization",
      };
    });

    return res.json({ drivers });
  }
);

router.get(
  "/emergencies/active",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("admin"),
  async (req, res) => {
    const db = getDb();
    const pending = await db
      .collection("requests")
      .where("status", "==", "pending")
      .limit(100)
      .get();
    const accepted = await db
      .collection("requests")
      .where("status", "==", "accepted")
      .limit(100)
      .get();

    return res.json({
      emergencies: [
        ...pending.docs.map((d) => ({ id: d.id, ...d.data() })),
        ...accepted.docs.map((d) => ({ id: d.id, ...d.data() })),
      ],
    });
  }
);

router.get(
  "/reports",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("admin"),
  async (req, res) => {
    const db = getDb();
    const snap = await db.collection("falseReports").limit(500).get();
    const reports = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const counts = {};
    for (const r of reports) {
      counts[r.reportedUserId] = (counts[r.reportedUserId] || 0) + 1;
    }

    return res.json({ reports, countsByUser: counts });
  }
);

export default router;
