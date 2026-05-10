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
      return res.json({ request: { id: snap.id, ...data } });
    }

    const mine = await db
      .collection("requests")
      .where("userId", "==", req.user.uid)
      .limit(50)
      .get();

    if (mine.empty) {
      return res.json({ request: null });
    }
    const sorted = mine.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort(
        (a, b) =>
          String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
      );
    return res.json({ request: sorted[0] });
  }
);

export default router;
