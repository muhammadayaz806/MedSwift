import "dotenv/config";
// MUST be imported before any routers are defined. It patches Express so
// that a thrown/rejected error inside an `async (req, res) => {...}` route
// handler is automatically forwarded to the error-handling middleware below,
// instead of becoming an unhandled promise rejection that kills the process.
// Without this, ANY unvalidated input that reaches a throwing call (a bad
// Firestore doc id, a network blip, etc.) in an async route with no manual
// try/catch takes the entire server down for every user.
import "express-async-errors";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { initFirebase } from "./config/firebase.js";
import emergencyRoutes from "./routes/emergency.js";
import driverRoutes from "./routes/driver.js";
import orgRoutes from "./routes/org.js";
import adminRoutes from "./routes/admin.js";
import authProfileRoutes from "./routes/authProfile.js";
import authEmailRoutes from "./routes/authEmail.js";
import rateLimit from "express-rate-limit";

initFirebase();

// Defense in depth: if something still slips through as an unhandled
// rejection (e.g. thrown outside the request/response cycle), log it
// instead of letting Node kill the whole process and every in-flight
// emergency request with it.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

const app = express();
const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || "0.0.0.0";

const corsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: corsOrigins.length ? corsOrigins : true,
    credentials: true,
  })
);

app.get("/health", (_req, res) => res.json({ ok: true, service: "medswift-api" }));

// Public, unauthenticated endpoints (OTP send, email lookup, etc.) are the
// easiest to abuse for email-bombing or enumeration since anyone can call
// them with no login. Cap request rate per IP.
const publicAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/auth/email", publicAuthLimiter);
app.use("/auth/profile/is-suspended", publicAuthLimiter);

app.use("/auth", authProfileRoutes);
app.use("/auth", authEmailRoutes);
app.use("/emergency", emergencyRoutes);
app.use("/driver", driverRoutes);
app.use("/org", orgRoutes);
app.use("/admin", adminRoutes);

// Global error handler. With express-async-errors imported above, every
// throw/rejection from an async route handler lands here instead of
// crashing the process. Respect a `status` set on the error (used
// throughout otp.js / authEmail.js / validate.js) so callers get a
// meaningful 400/403/404 instead of an opaque 500 where possible.
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = Number.isInteger(err?.status) ? err.status : 500;
  const message = status < 500 ? err.message : "Internal server error";
  res.status(status).json({ error: message });
});

app.listen(port, host, () => {
  console.log(`MedSwift API listening on http://${host}:${port}`);
});