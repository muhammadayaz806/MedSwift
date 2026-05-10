import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra || {};
const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
const base = (envApiUrl || extra.apiUrl || "http://localhost:4000").replace(
  /\/$/,
  ""
);

export async function api(path, options = {}, idToken) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (idToken) headers.Authorization = `Bearer ${idToken}`;
  const url = `${base}${path}`;
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
