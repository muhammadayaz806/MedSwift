export const ORG_REGISTER_URL =
  import.meta.env.VITE_ORG_REGISTER_URL || "http://localhost:5173/register";

/** Replace with your live App Store URL when published */
export const APP_STORE_URL =
  import.meta.env.VITE_APP_STORE_URL ||
  "https://apps.apple.com/app/medswift/id0000000000";

/** Matches mobile android.package in app.config.js */
export const PLAY_STORE_URL =
  import.meta.env.VITE_PLAY_STORE_URL ||
  "https://play.google.com/store/apps/details?id=com.medswift.app";

export const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Contact", href: "#contact" },
];
