import { getAuth, getDb } from "../config/firebase.js";

export async function verifyFirebaseToken(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Missing Bearer token" });
  }
  try {
    const decoded = await getAuth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export async function loadUserProfile(req, res, next) {
  const db = getDb();
  const snap = await db.collection("users").doc(req.user.uid).get();
  if (!snap.exists) {
    return res.status(403).json({ error: "User profile not found" });
  }
  req.profile = { id: snap.id, ...snap.data() };
  if (req.profile.status === "suspended") {
    return res.status(403).json({ error: "Account suspended" });
  }
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.profile || !roles.includes(req.profile.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
