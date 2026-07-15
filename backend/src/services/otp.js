import crypto from "crypto";
import { getDb } from "../config/firebase.js";
import { sendEmail, otpEmailContent } from "./email.js";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const TOKEN_TTL_MS = 15 * 60 * 1000;

const ALLOWED_PURPOSES = ["registration", "password_reset", "password_reset_driver"];

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function generateCode() {
  return String(crypto.randomInt(100000, 999999));
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function otpDocId(email, purpose) {
  return `${purpose}_${normalizeEmail(email)}`;
}

export async function sendOtp(email, purpose) {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes("@")) {
    throw Object.assign(new Error("Valid email required"), { status: 400 });
  }
  if (!ALLOWED_PURPOSES.includes(purpose)) {
    throw Object.assign(new Error("Invalid purpose"), { status: 400 });
  }

  const db = getDb();
  const docId = otpDocId(normalized, purpose);
  const ref = db.collection("otpCodes").doc(docId);
  const existing = await ref.get();

  if (existing.exists) {
    const lastSent = new Date(existing.data().createdAt).getTime();
    if (Date.now() - lastSent < RESEND_COOLDOWN_MS) {
      throw Object.assign(new Error("Please wait before requesting another code"), {
        status: 429,
      });
    }
  }

  const code = generateCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS).toISOString();

  await ref.set({
    email: normalized,
    purpose,
    code,
    attempts: 0,
    createdAt: now.toISOString(),
    expiresAt,
  });

  const { subject, text, html } = otpEmailContent(code, purpose);
  const emailResult = await sendEmail({ to: normalized, subject, text, html });

  const response = { ok: true, expiresInSeconds: OTP_TTL_MS / 1000 };
  if (process.env.NODE_ENV === "development") {
    console.log("[email:otp]", {
      to: normalized,
      purpose,
      code,
      delivery: emailResult.mock ? "mock" : "smtp",
    });
    response.devCode = code;
    response.delivery = emailResult.mock ? "mock" : "smtp";
  }

  return response;
}

export async function verifyOtp(email, code, purpose) {
  const normalized = normalizeEmail(email);
  const db = getDb();
  const ref = db.collection("otpCodes").doc(otpDocId(normalized, purpose));
  const snap = await ref.get();

  if (!snap.exists) {
    throw Object.assign(new Error("No verification code found. Request a new one."), {
      status: 400,
    });
  }

  const data = snap.data();
  if (data.purpose !== purpose) {
    throw Object.assign(new Error("Invalid verification code"), { status: 400 });
  }
  if (new Date(data.expiresAt).getTime() < Date.now()) {
    await ref.delete();
    throw Object.assign(new Error("Verification code expired. Request a new one."), {
      status: 400,
    });
  }
  if (data.attempts >= MAX_ATTEMPTS) {
    await ref.delete();
    throw Object.assign(new Error("Too many attempts. Request a new code."), {
      status: 400,
    });
  }

  if (String(code).trim() !== String(data.code)) {
    await ref.update({ attempts: (data.attempts || 0) + 1 });
    throw Object.assign(new Error("Incorrect verification code"), { status: 400 });
  }

  await ref.delete();

  const token = generateToken();
  const tokenExpiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  await db.collection("emailVerifications").doc(token).set({
    email: normalized,
    purpose,
    verifiedAt: new Date().toISOString(),
    expiresAt: tokenExpiresAt,
  });

  return { ok: true, token, expiresInSeconds: TOKEN_TTL_MS / 1000 };
}

export async function consumeVerificationToken(token, email, purpose) {
  const normalized = normalizeEmail(email);
  const db = getDb();
  const ref = db.collection("emailVerifications").doc(token);
  const snap = await ref.get();

  if (!snap.exists) {
    throw Object.assign(new Error("Invalid or expired verification token"), { status: 400 });
  }

  const data = snap.data();
  if (data.email !== normalized || data.purpose !== purpose) {
    throw Object.assign(new Error("Invalid verification token"), { status: 400 });
  }
  if (new Date(data.expiresAt).getTime() < Date.now()) {
    await ref.delete();
    throw Object.assign(new Error("Verification token expired"), { status: 400 });
  }

  await ref.delete();
  return { ok: true };
}
