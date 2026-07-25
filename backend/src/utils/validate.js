/**
 * Shared input validation helpers.
 *
 * Goal: reject bad input with a clean 400 BEFORE it reaches Firestore /
 * Realtime DB / Firebase Auth calls, instead of letting a malformed value
 * throw deep inside a driver call. Combined with express-async-errors +
 * the global error handler in index.js, nothing here can crash the process
 * even if a check is missed — but validating early gives the *user* a
 * useful error message instead of a generic 500.
 */

// Firestore document IDs: max 1500 bytes, cannot contain "/", cannot be
// "." or "..", cannot match __.*__. This covers the realistic cases that
// show up from client input (orgId, userId, requestId, driver :id param, etc).
const MAX_DOC_ID_BYTES = 1500;

export function isValidFirestoreId(value) {
  if (typeof value !== "string") return false;
  if (value.length === 0 || value.length > MAX_DOC_ID_BYTES) return false;
  if (value.includes("/")) return false;
  if (value === "." || value === "..") return false;
  if (/^__.*__$/.test(value)) return false;
  return true;
}

/** Throws a 400-tagged error if `value` isn't a safe Firestore doc id. */
export function requireValidId(value, fieldName = "id") {
  if (!isValidFirestoreId(value)) {
    throw Object.assign(new Error(`${fieldName} is invalid`), { status: 400 });
  }
  return value;
}

export function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

// Matches emoji (default emoji-presentation characters, pictographs
// explicitly forced into emoji style with U+FE0F, and flag pairs) without
// matching ordinary multilingual text or common typographic symbols —
// Urdu, Arabic, Chinese, accented Latin, currency/degree symbols, and
// crucially ©/™/® (which are technically "pictographic" in Unicode terms
// but default to plain text and show up in real org names) all pass
// through untouched.
const EMOJI_REGEX =
  /\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F|[\u{1F1E6}-\u{1F1FF}]{2}/u;

export function containsEmoji(value) {
  return typeof value === "string" && EMOJI_REGEX.test(value);
}

export function isValidLatLng(lat, lng) {
  return (
    isFiniteNumber(lat) &&
    isFiniteNumber(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/** Throws a 400-tagged error if lat/lng aren't finite numbers in valid range. */
export function requireValidLatLng(lat, lng) {
  if (!isValidLatLng(lat, lng)) {
    throw Object.assign(
      new Error("lat/lng must be finite numbers (lat: -90..90, lng: -180..180)"),
      { status: 400 }
    );
  }
}

/**
 * Coerce to a trimmed string and enforce a max length, so free-text fields
 * (name, notes, org name...) can never blow past Firestore's ~1MB document
 * size limit or otherwise bloat storage.
 */
export function cleanString(
  value,
  { maxLength = 500, fieldName = "field", allowEmoji = false } = {}
) {
  if (value === undefined || value === null) return "";
  if (typeof value === "object") {
    throw Object.assign(new Error(`${fieldName} must be text, not an object`), {
      status: 400,
    });
  }
  const str = String(value).trim();
  if (str.length > maxLength) {
    throw Object.assign(
      new Error(`${fieldName} must be ${maxLength} characters or fewer`),
      { status: 400 }
    );
  }
  if (!allowEmoji && containsEmoji(str)) {
    throw Object.assign(new Error(`${fieldName} cannot contain emoji`), {
      status: 400,
    });
  }
  return str;
}