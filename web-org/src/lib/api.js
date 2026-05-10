const base = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function api(path, options = {}, idToken) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (idToken) headers.Authorization = `Bearer ${idToken}`;
  const res = await fetch(`${base}${path}`, { ...options, headers });
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
