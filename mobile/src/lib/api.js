import Constants from "expo-constants";

const API_PORT = 4000;
const extra = Constants.expoConfig?.extra || {};

/** Same host Expo uses for Metro (QR code IP) — works on hotspot, LAN, etc. */
function getMetroHost() {
  const raw =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost ??
    Constants.manifest?.debuggerHost ??
    Constants.manifest2?.extra?.expoClient?.hostUri;
  if (!raw) return null;
  const host = raw.split(":")[0]?.trim();
  return host || null;
}

function resolveApiBase() {
  const envUrl = (process.env.EXPO_PUBLIC_API_URL || "").replace(/\/$/, "");
  const configured = (envUrl || extra.apiUrl || "").replace(/\/$/, "");
  const forceEnv = process.env.EXPO_PUBLIC_API_URL_FORCE === "1";

  if (__DEV__ && !forceEnv) {
    const metroHost = getMetroHost();
    if (metroHost && metroHost !== "localhost" && metroHost !== "127.0.0.1") {
      return `http://${metroHost}:${API_PORT}`;
    }
    if (configured && !configured.includes("YOUR_MACHINE")) {
      return configured;
    }
    return `http://localhost:${API_PORT}`;
  }

  return configured || `http://localhost:${API_PORT}`;
}

export const apiBase = resolveApiBase();

export async function api(path, options = {}, idToken) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (idToken) headers.Authorization = `Bearer ${idToken}`;
  const url = `${apiBase}${path}`;
  let res;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (e) {
    throw new Error(`Network request failed for ${url}: ${e?.message || "fetch error"}`);
  }
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(data.error || res.statusText || "Request failed");
  }
  return data;
}
