# MedSwift — Setup guide

This document walks through Firebase, Google Maps, environment variables, and first-time data seeding for the Accident & Emergency Coordination System (tasks.md).

## Architecture

| Piece | Stack | Purpose |
| ----- | ----- | ------- |
| `backend/` | Node.js + Express + Firebase Admin | REST APIs, Firestore writes, Realtime DB writes, push fan-out |
| `mobile/` | Expo (React Native) | Citizen + driver apps (maps, SOS, live tracking) |
| `web-org/` | React + Vite + Tailwind | Organization dashboards |
| `web-admin/` | React + Vite + Tailwind | Super admin panel |

**Secrets:** Never commit `.env` files or service account JSON. Use `.env.example` as a template.

---

## 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/) → *Create project*.
2. Enable **Authentication** → Sign-in method → **Email/Password**.
3. Enable **Cloud Firestore** (production mode is fine; default deny rules are in `firebase/firestore.rules`).
4. Enable **Realtime Database** → choose a location → start in locked mode, then paste rules from `firebase/database.rules.json` (adjust if you want stricter checks).
5. (Optional) Enable **Cloud Messaging** for native FCM tokens. Expo managed apps typically use **Expo push tokens**; the backend sends via `expo-server-sdk` when it detects `ExponentPushToken[...]`.

Copy your Web app config from **Project settings → Your apps → Web app** for the Vite apps and Expo `EXPO_PUBLIC_FIREBASE_*` values.

### Realtime Database URL

In Firebase Console → Realtime Database, copy the URL (e.g. `https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com`).

Put it in:

- `backend/.env` → `FIREBASE_DATABASE_URL`
- `web-org/.env` → `VITE_FIREBASE_DATABASE_URL`
- `mobile/.env` → `EXPO_PUBLIC_FIREBASE_DATABASE_URL`

---

## 2. Service account (backend only)

1. Firebase Console → Project settings → **Service accounts** → *Generate new private key*.
2. Save as `backend/serviceAccountKey.json` **or** set `GOOGLE_APPLICATION_CREDENTIALS` to its path in `backend/.env`.

Alternatively, store JSON as a single-line env var:

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

Do **not** commit this file.

---

## 3. Backend environment

`backend/.env` (from `.env.example`):

| Variable | Purpose |
| -------- | ------- |
| `PORT` | API port (default `4000`) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON |
| `FIREBASE_DATABASE_URL` | Required for live locations |
| `CORS_ORIGINS` | Comma-separated allowed web origins |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Email OTP for mobile (see `AUTH_EMAIL_SETUP.md`) |
| `EMAIL_FROM` | Sender shown in OTP emails |
| `EMAIL_MOCK` | `true` = log OTP to console in dev instead of sending |

For password reset, OTP registration, and email provider setup, see **`AUTH_EMAIL_SETUP.md`**.

Restart the API after changes.

---

## 4. Google Maps

### Web (`web-org`)

1. Google Cloud Console → enable **Maps JavaScript API**.
2. Create an API key; restrict by HTTP referrer for production.
3. `web-org/.env` → `VITE_GOOGLE_MAPS_API_KEY`

### Mobile (`mobile`)

1. Enable **Maps SDK for Android** / **Maps SDK for iOS** on the same Google Cloud project as your keys.
2. `mobile/.env`:

```env
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY=...
EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY=...
```

Expo reads these at build/prebuild time via `app.config.js`.

---

## 5. Seed a super admin

Firestore does **not** auto-create admins.

1. Firebase Console → **Authentication** → add a user (email/password).
2. Firestore → collection `users` → document ID = that user’s UID:

```json
{
  "name": "System Admin",
  "email": "admin@example.com",
  "role": "admin",
  "status": "active",
  "reportCount": 0,
  "organizationId": null,
  "createdAt": "2026-05-03T00:00:00.000Z"
}
```

3. Sign in at `web-admin` with that account.

---

## 6. Typical demo workflow

1. **Organization:** Open `web-org` → *Register* → creates `users` + `organizations` (`verified: false`).
2. **Approve:** Open `web-admin` → *Organizations* → **Approve** (sets `verified` + `active`).
3. **Drivers:** `web-org` → *Drivers* → add driver (backend creates Auth user + `users` + `drivers`).
4. **Driver mobile:** Sign in → toggle **Online** (writes `drivers/{uid}.isOnline`).
5. **Citizen mobile:** Register → **Emergency** button → creates `requests` + push to drivers.
6. **Driver:** Accept request → starts RTDB `liveLocations/{driverId}` updates + citizen **Track** tab reads them.

---

## 7. Networking tips

- Physical device: set `EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:4000` (not `localhost`).
- Windows Firewall: allow inbound TCP on port `4000` for LAN testing.
- Web dashboards: `VITE_API_URL=http://localhost:4000` is fine on the same machine.

---

## 8. Firestore indexes

Most queries use a single `where` equality. If you add features with compound queries, the Firebase console will link to “create index” from the error message.

---

## 9. Troubleshooting

| Symptom | Fix |
| ------- | --- |
| Backend throws Firebase init error | Check service account path / JSON env |
| Realtime listener empty | Confirm `FIREBASE_DATABASE_URL` and RTDB rules |
| Mobile cannot reach API | Use LAN IP, same Wi‑Fi, firewall |
| Map tiles blank | Maps API enabled + correct SDK keys |
| Push not received | Expo Go needs Expo push; ensure token saved (`users.fcmToken` stores Expo or FCM token) |

---

## 10. Security checklist (production)

- Rotate API keys; restrict Maps HTTP referrers / Android SHA1 / iOS bundle id.
- Tighten RTDB rules (`auth.token` custom claims if you move writes client-side).
- Run API behind HTTPS and narrow `CORS_ORIGINS`.
- Review Firestore rules before exposing client reads.

---

You’re ready to iterate on features defined in `tasks.md`. Use `QUICK_START.md` for day-to-day commands.
