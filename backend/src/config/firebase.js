import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let initialized = false;

export function initFirebase() {
  if (initialized) return admin;

  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const credPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(__dirname, "..", "..", "serviceAccountKey.json");

  const dbUrl = process.env.FIREBASE_DATABASE_URL;
  const opts = dbUrl ? { databaseURL: dbUrl } : {};

  if (inlineJson) {
    const parsed = JSON.parse(inlineJson);
    admin.initializeApp({
      credential: admin.credential.cert(parsed),
      ...opts,
    });
  } else if (fs.existsSync(credPath)) {
    const cred = JSON.parse(fs.readFileSync(credPath, "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(cred),
      ...opts,
    });
  } else {
    throw new Error(
      "Firebase Admin: set FIREBASE_SERVICE_ACCOUNT_JSON or place serviceAccountKey.json / GOOGLE_APPLICATION_CREDENTIALS"
    );
  }

  initialized = true;
  return admin;
}

export function getDb() {
  return admin.firestore();
}

export function getRtdb() {
  return admin.database();
}

export function getAuth() {
  return admin.auth();
}

export function getMessaging() {
  return admin.messaging();
}
