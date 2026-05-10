import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { initFirebase } from "./config/firebase.js";
import emergencyRoutes from "./routes/emergency.js";
import driverRoutes from "./routes/driver.js";
import orgRoutes from "./routes/org.js";
import adminRoutes from "./routes/admin.js";
import authProfileRoutes from "./routes/authProfile.js";

initFirebase();

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

app.use("/auth", authProfileRoutes);
app.use("/emergency", emergencyRoutes);
app.use("/driver", driverRoutes);
app.use("/org", orgRoutes);
app.use("/admin", adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, host, () => {
  console.log(`MedSwift API listening on http://${host}:${port}`);
});
