import { Router } from "express";
import { nanoid } from "nanoid";
import { getDb, getRtdb } from "../config/firebase.js";
import {
  verifyFirebaseToken,
  loadUserProfile,
  requireRole,
} from "../middleware/auth.js";
import { distanceKm } from "../services/geolocation.js";
import { sendPushToTokens } from "../services/notifications.js";
import { getActiveRequest } from "../services/emergencyState.js";

const router = Router();
const NEARBY_KM = 50;

router.post(
  "/request",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("user"),
  async (req, res) => {
    const { lat, lng } = req.body || {};
    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ error: "lat and lng required (numbers)" });
    }

    const db = getDb();
    const rtdb = getRtdb();

    const mineSnap = await db
      .collection("requests")
      .where("userId", "==", req.user.uid)
      .limit(50)
      .get();
    const activeRequest = getActiveRequest(
      mineSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    );

    if (activeRequest) {
      return res.status(200).json({
        ok: true,
        requestId: activeRequest.id,
        existing: true,
        message: "You already have an active emergency request.",
      });
    }

    const requestId = nanoid();
    const reqRef = db.collection("requests").doc(requestId);

    await reqRef.set({
      userId: req.user.uid,
      driverId: null,
      status: "pending",
      location: { latitude: lat, longitude: lng },
      createdAt: new Date().toISOString(),
      locked: false,
      organizationId: null,
    });

    const driversSnap = await db
      .collection("drivers")
      .where("status", "==", "active")
      .where("isOnline", "==", true)
      .get();

    const tokens = [];
    const candidateDrivers = [];

    for (const d of driversSnap.docs) {
      const driverData = d.data();
      const orgSnap = await db
        .collection("organizations")
        .doc(driverData.orgId)
        .get();
      const org = orgSnap.data();
      if (!org?.verified || org.active === false) continue;

      let live = null;
      try {
        const snap = await rtdb.ref(`liveLocations/${d.id}`).once("value");
        live = snap.val();
      } catch {
        /* RTDB path missing */
      }

      if (
        live?.latitude != null &&
        live?.longitude != null &&
        distanceKm(lat, lng, live.latitude, live.longitude) <= NEARBY_KM
      ) {
        candidateDrivers.push(d.id);
      } else if (!live) {
        candidateDrivers.push(d.id);
      }

      const userSnap = await db.collection("users").doc(driverData.userId).get();
      const u = userSnap.data();
      if (u?.fcmToken) tokens.push(u.fcmToken);
    }

    await sendPushToTokens(
      tokens,
      "New emergency nearby",
      "Open the driver app to accept the request.",
      { requestId, type: "emergency_new" }
    );

    return res.json({
      ok: true,
      requestId,
      notifiedDrivers: candidateDrivers.length,
    });
  }
);

router.get(
  "/status",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("user"),
  async (req, res) => {
    const { requestId } = req.query;
    const db = getDb();

    if (requestId) {
      const snap = await db.collection("requests").doc(String(requestId)).get();
      if (!snap.exists) return res.status(404).json({ error: "Not found" });
      const data = snap.data();
      if (data.userId !== req.user.uid) {
        return res.status(403).json({ error: "Forbidden" });
      }
      // Look up ambulance plate for the assigned driver
      let ambulancePlate = null;
      if (data.driverId) {
        const ambSnap = await db
          .collection("ambulances")
          .where("driverId", "==", data.driverId)
          .limit(1)
          .get();
        ambulancePlate = ambSnap.empty ? null : (ambSnap.docs[0].data().plate || null);
      }
      return res.json({ request: { id: snap.id, ...data, ambulancePlate } });
    }

    const mine = await db
      .collection("requests")
      .where("userId", "==", req.user.uid)
      .limit(50)
      .get();

    const active = getActiveRequest(
      mine.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    );

    // Look up ambulance plate for the assigned driver
    let ambulancePlate = null;
    if (active?.driverId) {
      const ambSnap = await db
        .collection("ambulances")
        .where("driverId", "==", active.driverId)
        .limit(1)
        .get();
      ambulancePlate = ambSnap.empty ? null : (ambSnap.docs[0].data().plate || null);
    }

    return res.json({ request: active ? { ...active, ambulancePlate } : null });
  }
);

export default router;
