# MedSwift — Auth, Email & OTP Setup

This guide covers password reset, email OTP (mobile citizens), and Firebase email configuration for admin and organization dashboards.

---

## Overview

| App | Sign-in flow | Forgot password | Registration OTP |
| --- | --- | --- | --- |
| **Mobile (citizen)** | Role picker → Citizen login | 6-digit OTP via backend email | Required before account creation |
| **Mobile (driver)** | Role picker → Driver login | Not available (org manages credentials) | N/A — org creates accounts |
| **web-org** | Email/password | Firebase reset link email | Not required (Firebase signup) |
| **web-admin** | Email/password | Firebase reset link email | N/A — manual seed |

### Two email systems

1. **Backend SMTP (nodemailer)** — OTP codes for mobile citizen registration and password reset.
2. **Firebase Auth emails** — Password reset links for web-admin and web-org (no backend SMTP needed).

---

## 1. Firebase email templates (web dashboards)

Firebase sends password reset emails automatically when you call `sendPasswordResetEmail`.

1. Open [Firebase Console](https://console.firebase.google.com/) → your project.
2. Go to **Authentication** → **Templates**.
3. Customize **Password reset** (and optionally **Email address verification**):
   - Set sender name to **MedSwift**
   - Add your support email
   - Customize the email body if desired
4. Under **Authentication** → **Settings** → **Authorized domains**, add your production domains (e.g. `yourdomain.com`).

### Testing web reset

1. Start `web-org` or `web-admin`.
2. Click **Forgot password?** on the login page.
3. Enter the account email → check inbox (and spam).

Reset links open in the browser and let the user set a new password via Firebase’s hosted page.

---

## 2. Backend SMTP (mobile OTP)

Mobile citizen flows use the MedSwift API to send 6-digit codes.

### Configure `backend/.env`

Copy from `backend/.env.example`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM="MedSwift" <your-email@gmail.com>

# Development: log OTP to API console instead of sending email
EMAIL_MOCK=true
```

### Provider options

| Provider | SMTP_HOST | Notes |
| -------- | ----------- | ----- |
| **Gmail** | `smtp.gmail.com` | Use an [App Password](https://support.google.com/accounts/answer/185833), not your normal password |
| **SendGrid** | `smtp.sendgrid.net` | User: `apikey`, Pass: your API key |
| **Mailgun** | `smtp.mailgun.org` | Use SMTP credentials from Mailgun dashboard |
| **Resend** | `smtp.resend.com` | User: `resend`, Pass: API key |

### Development without SMTP

Set `EMAIL_MOCK=true`. When a user requests an OTP, the 6-digit code is printed in the **backend terminal**:

```
[email:mock] { to: 'user@example.com', subject: 'MedSwift verification code: 482913', ... }
```

Restart the API after changing `.env`.

### API endpoints

| Method | Path | Body | Purpose |
| ------ | ---- | ---- | ------- |
| `GET` | `/auth/email/status` | — | Check if SMTP is configured |
| `POST` | `/auth/email/otp/send` | `{ email, purpose }` | Send OTP (`registration` or `password_reset`) |
| `POST` | `/auth/email/otp/verify` | `{ email, code, purpose }` | Verify OTP → returns `{ token }` |
| `POST` | `/auth/email/password/reset` | `{ email, token, newPassword }` | Set new password after OTP |

OTP codes expire in **10 minutes**. Verification tokens expire in **15 minutes**. Resend cooldown: **60 seconds**.

---

## 3. Mobile app flows

### Role selection (new)

When logged out, users first choose:

- **Citizen** — emergency requests, tracking, forgot password, registration
- **Ambulance driver** — trip acceptance; no forgot password (contact organization)

### Citizen registration (OTP required)

1. Enter email → **Send verification code**
2. Enter 6-digit code → **Verify email**
3. Enter name + password → **Register**

The backend requires a valid verification token before creating the Firestore profile (`POST /auth/profile/bootstrap`).

### Citizen forgot password

1. Citizen login → **Forgot password?**
2. Enter email → receive OTP
3. Verify code → set new password

Drivers who try to reset via this flow receive: *"Driver passwords are managed by your organization."*

---

## 4. Admin & organization forgot password

Both dashboards use Firebase’s built-in reset (no OTP):

- **web-admin**: `/forgot-password`
- **web-org**: `/forgot-password`

Works for any Firebase Auth account (admin, organization owner). Ensure the email exists in Firebase Authentication.

---

## 5. Firestore collections (automatic)

The backend creates these when OTP is used:

| Collection | Purpose |
| ---------- | ------- |
| `otpCodes/{purpose_email}` | Active OTP codes (deleted after verify) |
| `emailVerifications/{token}` | Short-lived tokens after OTP verify |

No manual seeding required.

---

## 6. Future email use cases

The email service (`backend/src/services/email.js`) can be extended for:

- Organization approval notifications when admin verifies an org
- Emergency status emails to citizens
- Marketing contact form (`web-marketing`) — currently UI-only
- Driver credential emails when org adds a driver (optional; today org shares password manually)

Example:

```js
import { sendEmail } from "../services/email.js";

await sendEmail({
  to: orgEmail,
  subject: "Your MedSwift organization was approved",
  text: "You can now log in and manage drivers.",
});
```

---

## 7. Troubleshooting

| Problem | Fix |
| ------- | --- |
| OTP not received | Check `EMAIL_MOCK=true` and read backend console; verify SMTP credentials |
| `Email is not configured` | Set `SMTP_*` vars or enable `EMAIL_MOCK=true` |
| Web reset email not received | Check Firebase Templates, spam folder, authorized domains |
| Registration fails after OTP | Token expired (15 min) — verify again and register immediately |
| Driver cannot reset password | By design — org owner resets via **Drivers** page or creates new credentials |
| Mobile cannot reach API | Ensure backend runs on port 4000; same Wi‑Fi/hotspot as phone |

---

## 8. Security notes

- OTP codes are stored in Firestore with expiry and attempt limits (max 5 wrong tries).
- Password reset rejects `role: driver` accounts.
- Citizen registration rejects bootstrap without a verified email token.
- Never commit `backend/.env` or SMTP passwords to git.
- In production, set `EMAIL_MOCK=false` and use a transactional email provider (SendGrid, Resend, etc.).

---

## Quick start checklist

- [ ] Firebase: Email/Password enabled
- [ ] Firebase: Customize password reset email template
- [ ] Backend: Copy SMTP settings to `backend/.env` (or `EMAIL_MOCK=true` for dev)
- [ ] Backend: `npm run dev` on port 4000
- [ ] Mobile: Reload Expo app → see role selection screen
- [ ] Test citizen registration with OTP (check backend console if mocking)
- [ ] Test web-org forgot password with Firebase email
