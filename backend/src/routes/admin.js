import { Router } from "express";
import { getDb } from "../config/firebase.js";
import {
  verifyFirebaseToken,
  loadUserProfile,
  requireRole,
} from "../middleware/auth.js";
import { requireValidId, cleanString } from "../utils/validate.js";

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
    requireValidId(orgId, "orgId");

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
    requireValidId(orgId, "orgId");
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
    requireValidId(userId, "userId");

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
    const [driversSnap, organizationsSnap, ambulancesSnap] = await Promise.all([
      db.collection("drivers").limit(500).get(),
      db.collection("organizations").limit(500).get(),
      db.collection("ambulances").limit(500).get(),
    ]);

    const organizationNames = {};
    for (const orgDoc of organizationsSnap.docs) {
      const orgData = orgDoc.data() || {};
      organizationNames[orgDoc.id] = orgData.name || "Unknown organization";
    }

    // Map driverId -> ambulance plate
    const ambulancePlateByDriver = {};
    for (const ambDoc of ambulancesSnap.docs) {
      const d = ambDoc.data() || {};
      if (d.driverId && d.plate) {
        ambulancePlateByDriver[d.driverId] = d.plate;
      }
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
        ambulancePlate: ambulancePlateByDriver[d.id] || null,
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

    const records = [
      ...pending.docs.map((d) => ({ id: d.id, ...d.data() })),
      ...accepted.docs.map((d) => ({ id: d.id, ...d.data() })),
    ];

    const userIds = [...new Set(records.map((r) => r.userId).filter(Boolean))];
    const driverIds = [...new Set(records.map((r) => r.driverId).filter(Boolean))];
    const organizationIds = [
      ...new Set(
        records
          .map((r) => r.organizationId)
          .filter(Boolean)
          .concat(records.map((r) => r.driverOrganizationId).filter(Boolean))
      ),
    ];
    const [usersSnap, driversSnap, organizationsSnap, ambulancesSnap] = await Promise.all([
      userIds.length
        ? Promise.all(userIds.map((id) => db.collection("users").doc(id).get()))
        : Promise.resolve([]),
      driverIds.length
        ? Promise.all(driverIds.map((id) => db.collection("drivers").doc(id).get()))
        : Promise.resolve([]),
      organizationIds.length
        ? Promise.all(organizationIds.map((id) => db.collection("organizations").doc(id).get()))
        : Promise.resolve([]),
      driverIds.length
        ? db.collection("ambulances").where("driverId", "in", driverIds).get()
        : Promise.resolve({ docs: [] }),
    ]);

    const userMap = new Map(
      usersSnap.map((doc) => [doc.id, { ...(doc.data() || {}), id: doc.id }])
    );
    const driverMap = new Map(
      driversSnap.map((doc) => [doc.id, { ...(doc.data() || {}), id: doc.id }])
    );
    const organizationMap = new Map(
      organizationsSnap.map((doc) => [doc.id, { ...(doc.data() || {}), id: doc.id }])
    );

    // Map driverId -> ambulance plate
    const ambulancePlateByDriver = {};
    for (const ambDoc of ambulancesSnap.docs) {
      const d = ambDoc.data() || {};
      if (d.driverId && d.plate) ambulancePlateByDriver[d.driverId] = d.plate;
    }

    const emergencies = records.map((record) => {
      const row = {
        ...record,
        requestLabel: "Emergency request",
        userName: "Unknown user",
        userEmail: "—",
        driverName: "—",
        driverOrganizationName: "—",
        ambulancePlate: null,
      };

      const userData = record.userId ? userMap.get(record.userId) : null;
      if (userData) {
        row.userName = userData.name || userData.displayName || userData.email || record.userId;
        row.userEmail = userData.email || "—";
      }

      if (record.driverId) {
        const driverData = driverMap.get(record.driverId);
        if (driverData?.name) {
          row.driverName = driverData.name;
        }
        const orgIdToLookup = record.organizationId || driverData?.orgId;
        if (orgIdToLookup) {
          const orgData = organizationMap.get(orgIdToLookup);
          if (orgData?.name) {
            row.driverOrganizationName = orgData.name;
          }
        }
        row.ambulancePlate = ambulancePlateByDriver[record.driverId] || null;
      }

      const dateSource = record.createdAt || record.updatedAt || record.acceptedAt;
      if (dateSource) {
        const date = new Date(dateSource);
        if (!Number.isNaN(date.getTime())) {
          row.requestLabel = `Emergency on ${date.toLocaleString()}`;
        }
      }

      return row;
    });

    return res.json({ emergencies });
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

    const driverIds = [...new Set(reports.map((r) => r.reporterId).filter(Boolean))];
    const userIds = [...new Set(reports.map((r) => r.reportedUserId).filter(Boolean))];
    const requestIds = [...new Set(reports.map((r) => r.requestId).filter(Boolean))];

    const [driversSnap, usersSnap, requestsSnap] = await Promise.all([
      driverIds.length
        ? Promise.all(driverIds.map((id) => db.collection("drivers").doc(id).get()))
        : Promise.resolve([]),
      userIds.length
        ? Promise.all(userIds.map((id) => db.collection("users").doc(id).get()))
        : Promise.resolve([]),
      requestIds.length
        ? Promise.all(requestIds.map((id) => db.collection("requests").doc(id).get()))
        : Promise.resolve([]),
    ]);

    const driverMap = new Map(
      driversSnap.map((doc) => [doc.id, { ...(doc.data() || {}), id: doc.id }])
    );
    const userMap = new Map(
      usersSnap.map((doc) => [doc.id, { ...(doc.data() || {}), id: doc.id }])
    );
    const requestMap = new Map(
      requestsSnap.map((doc) => [doc.id, { ...(doc.data() || {}), id: doc.id }])
    );

    const enrichedReports = reports.map((report) => {
      const row = {
        ...report,
        requestLabel: "Emergency request",
        reporterName: report.reporterId || "Unknown driver",
        reporterEmail: "—",
        reportedUserName: report.reportedUserId || "Unknown user",
        reportedUserEmail: "—",
      };

      const reporterData = report.reporterId ? driverMap.get(report.reporterId) : null;
      if (reporterData) {
        row.reporterName =
          reporterData.name || reporterData.displayName || reporterData.email || report.reporterId;
        row.reporterEmail = reporterData.email || "—";
      }

      const userData = report.reportedUserId ? userMap.get(report.reportedUserId) : null;
      if (userData) {
        row.reportedUserName =
          userData.name || userData.displayName || userData.email || report.reportedUserId;
        row.reportedUserEmail = userData.email || "—";
      }

      const requestData = report.requestId ? requestMap.get(report.requestId) : null;
      if (requestData) {
        const dateSource = requestData.createdAt || requestData.updatedAt || requestData.acceptedAt;
        if (dateSource) {
          const date = new Date(dateSource);
          if (!Number.isNaN(date.getTime())) {
            row.requestLabel = `Emergency on ${date.toLocaleString()}`;
          }
        }
      }

      return row;
    });
    return res.json({ reports: enrichedReports, countsByUser: counts });
  }
);

/** List all unsuspend requests (with user info) for admin review. */
router.get(
  "/unsuspend-requests",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("admin"),
  async (req, res) => {
    const db = getDb();
    const snap = await db
      .collection("unsuspendRequests")
      .orderBy("requestedAt", "desc")
      .limit(200)
      .get();
    return res.json({
      requests: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    });
  }
);

/** Approve an unsuspend request → set user status back to active. */
router.post(
  "/unsuspend-approve",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("admin"),
  async (req, res) => {
    const { requestId, reviewNote } = req.body || {};
    if (!requestId) {
      return res.status(400).json({ error: "requestId required" });
    }
    requireValidId(requestId, "requestId");
    const note = cleanString(reviewNote, { maxLength: 1000, fieldName: "reviewNote" });

    const db = getDb();
    const reqRef = db.collection("unsuspendRequests").doc(requestId);
    const reqSnap = await reqRef.get();
    if (!reqSnap.exists) {
      return res.status(404).json({ error: "Request not found" });
    }
    const { uid } = reqSnap.data();

    // Reactivate the user account
    await db.collection("users").doc(uid).update({
      status: "active",
      suspendedAt: null,
    });

    // Mark request as approved
    await reqRef.update({
      status: "approved",
      reviewedAt: new Date().toISOString(),
      reviewNote: note || null,
      reviewedBy: req.profile?.id || req.user.uid,
    });

    return res.json({ ok: true });
  }
);

/** Reject an unsuspend request — account stays suspended_by_user. */
router.post(
  "/unsuspend-reject",
  verifyFirebaseToken,
  loadUserProfile,
  requireRole("admin"),
  async (req, res) => {
    const { requestId, reviewNote } = req.body || {};
    if (!requestId) {
      return res.status(400).json({ error: "requestId required" });
    }
    requireValidId(requestId, "requestId");
    const note = cleanString(reviewNote, { maxLength: 1000, fieldName: "reviewNote" });

    const db = getDb();
    const reqRef = db.collection("unsuspendRequests").doc(requestId);
    const reqSnap = await reqRef.get();
    if (!reqSnap.exists) {
      return res.status(404).json({ error: "Request not found" });
    }

    await reqRef.update({
      status: "rejected",
      reviewedAt: new Date().toISOString(),
      reviewNote: note || null,
      reviewedBy: req.profile?.id || req.user.uid,
    });

    return res.json({ ok: true });
  }
);

export default router;