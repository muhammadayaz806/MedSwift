export function getActiveRequest(requests = []) {
  const activeStatuses = new Set(["pending", "accepted"]);
  const sorted = [...requests]
    .filter((request) => activeStatuses.has(request?.status))
    .sort((a, b) => {
      const aTime = String(a?.createdAt || "");
      const bTime = String(b?.createdAt || "");
      return bTime.localeCompare(aTime);
    });

  return sorted[0] || null;
}
