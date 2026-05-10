import { Router } from "express";
import { getDb, getRtdb } from "../config/firebase.js";
import {
  verifyFirebaseToken,
  loadUserProfile,
  requireRole,
} from "../middleware/auth.js";
import { sendPushToTokens } from "../services/notifications.js";

const router = Router();

router.patch(
  "/status",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("driver"),
  async (req, res) => {
    const { isOnline } = req.body || {};
    if (typeof isOnline !== "boolean") {
      return res.status(400).json({ error: "isOnline boolean required" });
    }
    const db = getDb();
    const ref = db.collection("drivers").doc(req.user.uid);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(400).json({ error: "Driver record missing" });
    }
    await ref.update({ isOnline });
    return res.json({ ok: true });
  }
);

router.get(
  "/requests",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("driver"),
  async (req, res) => {
    const db = getDb();
    const driverSnap = await db.collection("drivers").doc(req.user.uid).get();
    if (!driverSnap.exists) {
      return res.json({ requests: [] });
    }
    const { orgId } = driverSnap.data();

    const pending = await db
      .collection("requests")
      .where("status", "==", "pending")
      .limit(40)
      .get();

    const list = [];
    for (const doc of pending.docs) {
      const row = doc.data();
      if (!row.locked) list.push({ id: doc.id, ...row });
    }

    return res.json({ requests: list, orgId });
  }
);

router.post(
  "/accept",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("driver"),
  async (req, res) => {
    const { requestId } = req.body || {};
    if (!requestId) {
      return res.status(400).json({ error: "requestId required" });
    }

    const db = getDb();
    const driverRef = db.collection("drivers").doc(req.user.uid);
    const driverSnap = await driverRef.get();
    if (!driverSnap.exists) {
      return res.status(400).json({ error: "Driver profile missing" });
    }
    const driver = driverSnap.data();

    const reqRef = db.collection("requests").doc(requestId);
    let userId;
    try {
      userId = await db.runTransaction(async (tx) => {
        const snap = await tx.get(reqRef);
        if (!snap.exists) throw new Error("NOT_FOUND");
        const data = snap.data();
        if (data.status !== "pending" || data.locked) {
          throw new Error("LOCKED");
        }
        tx.update(reqRef, {
          status: "accepted",
          driverId: req.user.uid,
          locked: true,
          organizationId: driver.orgId,
          acceptedAt: new Date().toISOString(),
        });
        return data.userId;
      });
    } catch (e) {
      const code = e?.message;
      if (code === "NOT_FOUND") return res.status(404).json({ error: "Not found" });
      if (code === "LOCKED") {
        return res.status(409).json({ error: "Request already assigned" });
      }
      throw e;
    }

    const userSnap = await db.collection("users").doc(userId).get();
    const u = userSnap.data();
    await sendPushToTokens(
      u?.fcmToken ? [u.fcmToken] : [],
      "Ambulance assigned",
      "A driver has accepted your emergency request.",
      { requestId, type: "emergency_accepted" }
    );

    return res.json({ ok: true, requestId });
  }
);

router.post(
  "/location",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("driver"),
  async (req, res) => {
    const { lat, lng } = req.body || {};
    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ error: "lat and lng required" });
    }

    const rtdb = getRtdb();
    await rtdb.ref(`liveLocations/${req.user.uid}`).set({
      latitude: lat,
      longitude: lng,
      timestamp: Date.now(),
    });

    return res.json({ ok: true });
  }
);

router.post(
  "/complete",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("driver"),
  async (req, res) => {
    const { requestId } = req.body || {};
    if (!requestId) return res.status(400).json({ error: "requestId required" });

    const db = getDb();
    const rtdb = getRtdb();
    const reqRef = db.collection("requests").doc(requestId);
    const snap = await reqRef.get();
    if (!snap.exists) return res.status(404).json({ error: "Not found" });
    const data = snap.data();
    if (data.driverId !== req.user.uid) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await reqRef.update({
      status: "completed",
      completedAt: new Date().toISOString(),
    });

    await rtdb.ref(`liveLocations/${req.user.uid}`).remove();

    return res.json({ ok: true });
  }
);

router.post(
  "/report-false",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("driver"),
  async (req, res) => {
    const { requestId, notes } = req.body || {};
    if (!requestId) return res.status(400).json({ error: "requestId required" });

    const db = getDb();
    const reqSnap = await db.collection("requests").doc(requestId).get();
    if (!reqSnap.exists) return res.status(404).json({ error: "Not found" });
    const rdata = reqSnap.data();
    if (rdata.driverId !== req.user.uid) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await db.collection("falseReports").add({
      reporterId: req.user.uid,
      reportedUserId: rdata.userId,
      requestId,
      notes: notes || "",
      createdAt: new Date().toISOString(),
    });

    const userRef = db.collection("users").doc(rdata.userId);
    await db.runTransaction(async (tx) => {
      const us = await tx.get(userRef);
      const count = (us.data()?.reportCount || 0) + 1;
      tx.update(userRef, {
        reportCount: count,
        ...(count >= 3 ? { status: "suspended" } : {}),
      });
    });

    return res.json({ ok: true });
  }
);

export default router;
