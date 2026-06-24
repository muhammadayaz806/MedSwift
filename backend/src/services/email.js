import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

export function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  );
}

export async function sendEmail({ to, subject, text, html }) {
  const from =
    process.env.EMAIL_FROM || `"MedSwift" <${process.env.SMTP_USER}>`;

  const tx = getTransporter();
  if (!tx) {
    if (process.env.EMAIL_MOCK === "true" || process.env.NODE_ENV === "development") {
      console.log("[email:mock]", { to, subject, text });
      return { ok: true, mock: true };
    }
    throw new Error(
      "Email is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in backend/.env"
    );
  }

  await tx.sendMail({ from, to, subject, text, html });
  return { ok: true };
}

export function otpEmailContent(code, purpose) {
  const purposeLabel =
    purpose === "registration"
      ? "verify your MedSwift account"
      : purpose === "password_reset"
        ? "reset your MedSwift password"
        : "complete your request";

  const subject = `MedSwift verification code: ${code}`;
  const text = `Your MedSwift verification code is ${code}. Use it to ${purposeLabel}. This code expires in 10 minutes. If you did not request this, ignore this email.`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#dc2626;margin:0 0 8px">MedSwift</h2>
      <p style="color:#334155">Use this code to ${purposeLabel}:</p>
      <p style="font-size:32px;font-weight:800;letter-spacing:6px;color:#0f172a">${code}</p>
      <p style="color:#64748b;font-size:14px">Expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>
    </div>`;

  return { subject, text, html };
}
