# MedSwift — Quick start

Minimal steps to run everything locally after Firebase is configured (see `SETUP_GUIDE.md`).

## 1. Backend API

```bash
cd backend
cp .env.example .env
# Add service account path + FIREBASE_DATABASE_URL (see SETUP_GUIDE)
npm install
npm run dev
```

API base: `http://localhost:4000` (health check: `/health`).

## 2. Organization dashboard (React + Vite)

```bash
cd web-org
cp .env.example .env
# Fill VITE_* variables (Firebase web config + VITE_API_URL + Maps key)
npm install
npm run dev
```

Opens `http://localhost:5173`.

## 3. Super admin dashboard

```bash
cd web-admin
cp .env.example .env
npm install
npm run dev
```

Opens `http://localhost:5174`.

## 4. Mobile (Expo)

```bash
cd mobile
cp .env.example .env
# Use your LAN IP in EXPO_PUBLIC_API_URL so a phone can reach the API
npm install
npx expo start
```

Scan the QR code with Expo Go (same Wi‑Fi as your PC).

## 5. Smoke test order

1. Create super admin user (Firebase Auth + Firestore `users/{uid}` `role: admin`) — details in `SETUP_GUIDE.md`.
2. Register an organization on `web-org`, approve it in `web-admin`.
3. Add a driver in `web-org`; sign in as driver on mobile and toggle **Online**.
4. Register a citizen on mobile; send an emergency; accept from driver; watch **Track**.

If anything fails, see troubleshooting in `SETUP_GUIDE.md`.
