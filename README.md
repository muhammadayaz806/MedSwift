# MedSwift

Accident and Emergency Coordination System for faster ambulance response and better operational visibility.

MedSwift includes:
- Mobile app for citizens (raise emergencies, track assigned ambulance)
- Mobile app for drivers (go online, accept trips, share live location)
- Organization dashboard (manage drivers, monitor operations)
- Super admin dashboard (approve organizations, system oversight)
- Marketing website (public information and onboarding entry point)
- Backend API (role-aware business logic, notifications, realtime updates)

## What the project can do right now

- User, driver, organization, and admin authentication using Firebase Auth
- Emergency request creation and assignment flow
- Driver online/offline availability and request acceptance
- Live driver location tracking using Firebase Realtime Database
- Request status transitions (`pending`, `accepted`, `completed`)
- Organization approval lifecycle (admin controls verification/activation)
- Driver management from organization dashboard
- Abuse reporting and user suspension threshold handling
- Push notification fan-out via backend (Expo push token support)

## Architecture

| Module | Stack | Purpose |
| --- | --- | --- |
| `backend/` | Node.js, Express, Firebase Admin | REST API, Firestore + RTDB writes, notifications |
| `mobile/` | Expo, React Native, Firebase client SDK | Citizen + driver mobile experiences |
| `web-org/` | React, Vite, Tailwind, Firebase client SDK | Organization portal |
| `web-admin/` | React, Vite, Tailwind, Firebase client SDK | Super admin portal |
| `web-marketing/` | React, Vite, Tailwind | Public-facing website |
| `firebase/` | Firestore + RTDB rules files | Security rules baseline |

## Repository structure

```text
MedSwift/
  backend/          # API + server-side Firebase integration
  mobile/           # Expo app (citizen + driver)
  web-org/          # Organization dashboard
  web-admin/        # Admin dashboard
  web-marketing/    # Marketing website
  firebase/         # Firebase rules
  SETUP_GUIDE.md    # Deep setup guide (Firebase + Maps + seed data)
  QUICK_START.md    # Day-to-day run commands
  tasks.md          # Scope and feature planning notes
```

## Prerequisites

- Node.js 18+ and npm
- Firebase project with:
  - Authentication (Email/Password)
  - Cloud Firestore
  - Realtime Database
- Google Maps APIs:
  - Maps JavaScript API (web)
  - Maps SDK for Android / iOS (mobile)
- Expo Go app (for mobile testing on physical device)

## Complete setup (first time)

### 1) Configure Firebase project

Follow `SETUP_GUIDE.md` for complete instructions. Minimum checklist:
- Create Firebase project
- Enable Auth, Firestore, and Realtime Database
- Copy Web App Firebase config values
- Copy Realtime Database URL

### 2) Configure backend service account

In Firebase Console:
- Project settings -> Service accounts -> Generate private key
- Save JSON as `backend/serviceAccountKey.json` (do not commit)

Backend supports either:
- `GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json`, or
- `FIREBASE_SERVICE_ACCOUNT_JSON=...` inline JSON

### 3) Create `.env` files from examples

From project root, create environment files:
- `backend/.env` from `backend/.env.example`
- `mobile/.env` from `mobile/.env.example`
- `web-org/.env` from `web-org/.env.example`
- `web-admin/.env` from `web-admin/.env.example`
- `web-marketing/.env` from `web-marketing/.env.example`

Important:
- Never commit real `.env` files
- Use LAN IP for mobile API URL (`EXPO_PUBLIC_API_URL=http://YOUR_IP:4000`)

### 4) Add Google Maps keys

- `web-org/.env`: `VITE_GOOGLE_MAPS_API_KEY`
- `mobile/.env`:
  - `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY`
  - `EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY`

## Environment variables reference

### Backend (`backend/.env`)

- `PORT` (default `4000`)
- `NODE_ENV`
- `GOOGLE_APPLICATION_CREDENTIALS`
- `FIREBASE_SERVICE_ACCOUNT_JSON` (optional alternative)
- `FIREBASE_DATABASE_URL`
- `CORS_ORIGINS` (comma-separated)

### Mobile (`mobile/.env`)

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_DATABASE_URL`
- `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY`
- `EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY`

### Organization dashboard (`web-org/.env`)

- `VITE_API_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_DATABASE_URL`
- `VITE_GOOGLE_MAPS_API_KEY`

### Admin dashboard (`web-admin/.env`)

- `VITE_API_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### Marketing site (`web-marketing/.env`)

- `VITE_ORG_REGISTER_URL`
- `VITE_APP_STORE_URL`
- `VITE_PLAY_STORE_URL`

## Install and run all modules

Open separate terminals for each module.

### Backend

```bash
cd backend
npm install
npm run dev
```

Health check: `http://localhost:4000/health`

### Marketing website

```bash
cd web-marketing
npm install
npm run dev
```

Default URL: `http://localhost:5175`

### Organization dashboard

```bash
cd web-org
npm install
npm run dev
```

Default URL: `http://localhost:5173`

### Super admin dashboard

```bash
cd web-admin
npm install
npm run dev
```

Default URL: `http://localhost:5174`

### Mobile app (Expo)

```bash
cd mobile
npm install
npx expo start
```

Scan QR from Expo Go on the same Wi-Fi network.

## Seed initial admin account

Before using the admin dashboard:

1. Create Firebase Auth user (email/password)
2. Create Firestore `users/{uid}` document with:
   - `role: "admin"`
   - `status: "active"`
   - other profile fields (`name`, `email`, etc.)
3. Log in via `web-admin`

See `SETUP_GUIDE.md` for sample document payload.

## End-to-end demo flow

1. Organization registers in `web-org`
2. Admin approves organization in `web-admin`
3. Organization creates driver account
4. Driver logs in on mobile and toggles online
5. Citizen sends emergency request on mobile
6. Driver accepts request
7. Citizen tracks live ambulance location
8. Driver completes trip

## Core data model

Firestore collections used:
- `users`
- `organizations`
- `drivers`
- `ambulances`
- `requests`

Realtime Database path:
- `liveLocations/{driverId}`

## Troubleshooting

- Mobile cannot hit backend:
  - Use machine LAN IP instead of `localhost`
  - Ensure phone and PC are on same network
  - Allow port `4000` through firewall
- Firebase initialization errors in backend:
  - Re-check service account path or JSON env var
- Realtime tracking not updating:
  - Verify `FIREBASE_DATABASE_URL` in backend/web/mobile
  - Verify RTDB rules are applied
- Maps blank:
  - Confirm APIs are enabled and keys match platform restrictions
- No push notifications:
  - Ensure token is stored for user/driver and backend can send push

## Security notes

- Do not commit service account keys or real `.env` files
- Restrict Google Maps keys (referrer / package / bundle restrictions)
- Tighten Firebase rules before production launch
- Use HTTPS + strict `CORS_ORIGINS` in production

## Useful docs in this repo

- `SETUP_GUIDE.md` -> full infrastructure setup
- `QUICK_START.md` -> quick day-to-day startup
- `tasks.md` -> implementation scope and module details

## Keep GitHub updated after every change

Use this flow each time you finish a set of changes:

```bash
git status
git add .
git commit -m "Describe what changed"
git push origin <your-branch-name>
```

If you are working directly on `main`:

```bash
git push origin main
```

Recommended branch flow:
- Create feature branch: `git checkout -b feature/<short-name>`
- Commit frequently with clear messages
- Push branch and open pull request for review/backup

Important:
- Never commit `.env` files or service account JSON keys
- Check `git status` before commit to avoid pushing unwanted files

## Status

Current codebase contains working foundations for:
- Multi-role authentication
- Emergency dispatch lifecycle
- Driver live tracking
- Organization and admin operational panels

This README should be updated as features evolve so onboarding remains easy for you and future contributors.
