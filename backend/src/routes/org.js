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

    const normalizedEmail = String(email).trim().toLowerCase();

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

    // Check if the email already exists in Firebase Auth
    try {
      await getAuth().getUserByEmail(normalizedEmail);
      return res.status(400).json({
        error: "An account with this email address already exists. Please use a different email.",
      });
    } catch (e) {
      if (e.code !== "auth/user-not-found") {
        return res.status(500).json({ error: e.message || "Failed to check email availability." });
      }
    }

    // Check if the email already exists in Firestore users collection
    const userEmailSnap = await db
      .collection("users")
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();
    if (!userEmailSnap.empty) {
      return res.status(400).json({
        error: "An account with this email address already exists. Please use a different email.",
      });
    }

    let uid;
    try {
      const userRecord = await getAuth().createUser({
        email: normalizedEmail,
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
        email: normalizedEmail,
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
        email: normalizedEmail,
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

    const [driversSnap, ambulancesSnap] = await Promise.all([
      db.collection("drivers").where("orgId", "==", orgId).get(),
      db.collection("ambulances").where("orgId", "==", orgId).get(),
    ]);

    // Map driverId -> ambulance plate
    const ambulancePlateByDriver = {};
    for (const ambDoc of ambulancesSnap.docs) {
      const d = ambDoc.data() || {};
      if (d.driverId && d.plate) ambulancePlateByDriver[d.driverId] = d.plate;
    }

    const drivers = driversSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      ambulancePlate: ambulancePlateByDriver[d.id] || null,
    }));
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
    const { status, isOnline, name, email } = req.body || {};
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

    const currentDriver = dSnap.data();

    // Prepare update structures
    const authUpdate = {};
    const userUpdate = {};
    const driverUpdate = {};

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return res.status(400).json({ error: "Name cannot be empty" });
      }
      authUpdate.displayName = trimmedName;
      userUpdate.name = trimmedName;
      driverUpdate.name = trimmedName;
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!normalizedEmail) {
        return res.status(400).json({ error: "Email cannot be empty" });
      }

      // Check if email is changing
      if (normalizedEmail !== currentDriver.email?.toLowerCase()) {
        // Check if email already exists in Firebase Auth for another user
        try {
          const existingAuthUser = await getAuth().getUserByEmail(normalizedEmail);
          if (existingAuthUser.uid !== id) {
            return res.status(400).json({
              error: "An account with this email address already exists. Please use a different email.",
            });
          }
        } catch (e) {
          if (e.code !== "auth/user-not-found") {
            return res.status(500).json({ error: e.message || "Failed to check email availability." });
          }
        }

        // Check if email already exists in Firestore users collection for another user
        const userEmailSnap = await db
          .collection("users")
          .where("email", "==", normalizedEmail)
          .limit(2)
          .get();
        const hasOther = userEmailSnap.docs.some((doc) => doc.id !== id);
        if (hasOther) {
          return res.status(400).json({
            error: "An account with this email address already exists. Please use a different email.",
          });
        }

        authUpdate.email = normalizedEmail;
        userUpdate.email = normalizedEmail;
        driverUpdate.email = normalizedEmail;
      }
    }

    if (status === "active" || status === "inactive") {
      driverUpdate.status = status;
    }
    if (typeof isOnline === "boolean") {
      driverUpdate.isOnline = isOnline;
    }

    // Perform Firebase Auth update if needed
    if (Object.keys(authUpdate).length > 0) {
      try {
        await getAuth().updateUser(id, authUpdate);
      } catch (e) {
        return res.status(400).json({ error: e.message || "Failed to update auth credentials." });
      }
    }

    // Perform Firestore updates
    try {
      if (Object.keys(driverUpdate).length > 0) {
        await db.collection("drivers").doc(id).update(driverUpdate);
      }
      if (Object.keys(userUpdate).length > 0) {
        await db.collection("users").doc(id).update(userUpdate);
      }

      if (status === "inactive") {
        await db.collection("users").doc(id).update({ status: "suspended" });
      } else if (status === "active") {
        await db.collection("users").doc(id).update({ status: "active" });
      }
    } catch (e) {
      return res.status(500).json({ error: e.message || "Failed to update database profile" });
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

    const normalizedPlate = plate.trim().replace(/\s+/g, " ");
    if (!/^[A-Z0-9]+([ -][A-Z0-9]+)*$/.test(normalizedPlate)) {
      return res.status(400).json({
        error: "Plate number can only contain uppercase letters, numbers, and single spaces or hyphens as separators. Consecutive spaces/hyphens or leading/trailing separators are not allowed.",
      });
    }

    // Check if an ambulance with the same plate already exists
    const plateCheckSnap = await db
      .collection("ambulances")
      .where("plate", "==", normalizedPlate)
      .limit(1)
      .get();
    if (!plateCheckSnap.empty) {
      return res.status(409).json({
        error: `An ambulance with plate number "${normalizedPlate}" already exists.`,
      });
    }

    if (driverId) {
      const dSnap = await db.collection("drivers").doc(driverId).get();
      if (!dSnap.exists || dSnap.data().orgId !== orgId) {
        return res.status(400).json({ error: "Invalid driver" });
      }

      // Ensure driver isn't already assigned to another ambulance
      const existingSnap = await db
        .collection("ambulances")
        .where("driverId", "==", driverId)
        .limit(1)
        .get();
      if (!existingSnap.empty) {
        const existingPlate = existingSnap.docs[0].data().plate || existingSnap.docs[0].id;
        return res.status(409).json({
          error: `This driver is already assigned to ambulance ${existingPlate}. A driver can only be assigned to one ambulance at a time.`,
        });
      }
    }

    const id = nanoid();
    await db.collection("ambulances").doc(id).set({
      orgId,
      plate: normalizedPlate,
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

      // Ensure driver isn't already assigned to a *different* ambulance
      const existingSnap = await db
        .collection("ambulances")
        .where("driverId", "==", driverId)
        .limit(1)
        .get();
      if (!existingSnap.empty && existingSnap.docs[0].id !== id) {
        const existingPlate = existingSnap.docs[0].data().plate || existingSnap.docs[0].id;
        return res.status(409).json({
          error: `This driver is already assigned to ambulance ${existingPlate}. A driver can only be assigned to one ambulance at a time.`,
        });
      }
    }

    await aRef.update({ driverId: driverId ?? null });
    return res.json({ ok: true });
  }
);

router.delete(
  "/ambulance/:id",
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

    const aRef = db.collection("ambulances").doc(id);
    const aSnap = await aRef.get();
    if (!aSnap.exists || aSnap.data().orgId !== orgId) {
      return res.status(404).json({ error: "Not found" });
    }

    await aRef.delete();
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

    const [ambSnap, driversSnap] = await Promise.all([
      db.collection("ambulances").where("orgId", "==", orgId).get(),
      db.collection("drivers").where("orgId", "==", orgId).get(),
    ]);

    // Map driverId -> driver name
    const driverNameById = {};
    for (const dDoc of driversSnap.docs) {
      const d = dDoc.data() || {};
      driverNameById[dDoc.id] = d.name || d.email || dDoc.id;
    }

    return res.json({
      ambulances: ambSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        driverName: d.data().driverId ? (driverNameById[d.data().driverId] || d.data().driverId) : null,
      })),
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

    const userIds = [...new Set(list.map((r) => r.userId).filter(Boolean))];
    const driverIds = [...new Set(list.map((r) => r.driverId).filter(Boolean))];
    const organizationIds = [
      ...new Set(
        list
          .map((r) => r.organizationId)
          .filter(Boolean)
          .concat(list.map((r) => r.driverOrganizationId).filter(Boolean))
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

    const emergencies = list.map((record) => {
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

    const getTimestampMs = (value) => {
      if (!value) return 0;
      if (value?.toDate) return value.toDate().getTime();
      const date = value instanceof Date ? value : new Date(value);
      return Number.isNaN(date.getTime()) ? 0 : date.getTime();
    };

    const completedRequests = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((r) => r.status === "completed")
      .sort((a, b) => getTimestampMs(b.completedAt || b.createdAt) - getTimestampMs(a.completedAt || a.createdAt))
      .slice(0, 100);

    const history = [];

    for (const record of completedRequests) {
      const row = {
        ...record,
        requestLabel: "Completed emergency",
        driverName: "Unassigned driver",
        organizationName: "Unknown organization",
        ambulancePlate: null,
      };

      if (record.driverId) {
        const driverSnap = await db.collection("drivers").doc(record.driverId).get();
        const driverData = driverSnap.exists ? driverSnap.data() : null;
        if (driverData?.name) {
          row.driverName = driverData.name;
        }

        const orgIdToLookup = record.organizationId || driverData?.orgId;
        if (orgIdToLookup) {
          const orgSnap = await db.collection("organizations").doc(orgIdToLookup).get();
          if (orgSnap.exists && orgSnap.data()?.name) {
            row.organizationName = orgSnap.data().name;
          }
        }

        // Prefer the plate snapshotted at acceptance time (accurate historical record).
        // Fall back to live driver→ambulance lookup only for older requests.
        if (record.ambulancePlate) {
          row.ambulancePlate = record.ambulancePlate;
        } else {
          const ambSnap = await db
            .collection("ambulances")
            .where("driverId", "==", record.driverId)
            .limit(1)
            .get();
          if (!ambSnap.empty && ambSnap.docs[0].data().plate) {
            row.ambulancePlate = ambSnap.docs[0].data().plate;
          }
        }
      }

      const dateSource = record.createdAt || record.completedAt;
      if (dateSource) {
        const date = new Date(dateSource);
        if (!Number.isNaN(date.getTime())) {
          row.requestLabel = `Emergency on ${date.toLocaleString()}`;
        }
      }

      history.push(row);
    }

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

    const driverIdsToLookup = [...new Set(reports.map((r) => r.reporterId).filter(Boolean))];
    const userIdsToLookup = [...new Set(reports.map((r) => r.reportedUserId).filter(Boolean))];
    const requestIdsToLookup = [...new Set(reports.map((r) => r.requestId).filter(Boolean))];

    const [driversLookupSnap, usersLookupSnap, requestsLookupSnap] = await Promise.all([
      driverIdsToLookup.length
        ? Promise.all(driverIdsToLookup.map((id) => db.collection("drivers").doc(id).get()))
        : Promise.resolve([]),
      userIdsToLookup.length
        ? Promise.all(userIdsToLookup.map((id) => db.collection("users").doc(id).get()))
        : Promise.resolve([]),
      requestIdsToLookup.length
        ? Promise.all(requestIdsToLookup.map((id) => db.collection("requests").doc(id).get()))
        : Promise.resolve([]),
    ]);

    const driverMap = new Map(
      driversLookupSnap.map((doc) => [doc.id, { ...(doc.data() || {}), id: doc.id }])
    );
    const userMap = new Map(
      usersLookupSnap.map((doc) => [doc.id, { ...(doc.data() || {}), id: doc.id }])
    );
    const requestMap = new Map(
      requestsLookupSnap.map((doc) => [doc.id, { ...(doc.data() || {}), id: doc.id }])
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

    return res.json({ reports: enrichedReports });
  }
);

export default router;
