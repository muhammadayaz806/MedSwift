import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function UnsuspendRequestsPage() {
  const { getToken } = useAuth();
  const [requests, setRequests] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(null); // requestId being actioned
  const [reviewNote, setReviewNote] = useState({});   // { [requestId]: string }

  const loadRequests = useCallback(async () => {
    setErr("");
    setLoading(true);
    try {
      const token = await getToken();
      const r = await api("/admin/unsuspend-requests", { method: "GET" }, token);
      setRequests(r.requests || []);
    } catch (e) {
      setErr(e.message);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  async function handleAction(requestId, action) {
    setActionBusy(requestId);
    setErr("");
    try {
      const token = await getToken();
      const endpoint = action === "approve" ? "/admin/unsuspend-approve" : "/admin/unsuspend-reject";
      await api(
        endpoint,
        {
          method: "POST",
          body: JSON.stringify({
            requestId,
            reviewNote: reviewNote[requestId] || null,
          }),
        },
        token
      );
      await loadRequests();
    } catch (e) {
      setErr(e.message);
    } finally {
      setActionBusy(null);
    }
  }

  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending");

  function fmt(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString();
  }

  function RequestRow({ req }) {
    const isBusy = actionBusy === req.id;
    const isPending = req.status === "pending";
    return (
      <tr key={req.id} className="border-t border-brand-border align-top">
        <td className="px-4 py-3">
          <p className="font-medium text-brand-ink">{req.name || "—"}</p>
          <p className="text-brand-sub text-xs mt-0.5">{req.email}</p>
        </td>
        <td className="px-4 py-3 text-brand-sub text-sm hidden md:table-cell">
          {fmt(req.requestedAt)}
        </td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
              STATUS_STYLES[req.status] || "bg-brand-muted text-brand-sub"
            }`}
          >
            {req.status}
          </span>
        </td>
        <td className="px-4 py-3 hidden lg:table-cell text-brand-sub text-sm">
          {req.reviewedAt ? fmt(req.reviewedAt) : "—"}
        </td>
        <td className="px-4 py-3 text-right">
          {isPending ? (
            <div className="flex flex-col items-end gap-2">
              <input
                type="text"
                placeholder="Optional note…"
                className="w-44 rounded-lg border border-brand-border bg-brand-bg px-2 py-1 text-xs text-brand-text placeholder:text-brand-sub"
                value={reviewNote[req.id] || ""}
                onChange={(e) =>
                  setReviewNote((prev) => ({ ...prev, [req.id]: e.target.value }))
                }
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleAction(req.id, "approve")}
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition"
                >
                  {isBusy ? "…" : "Approve"}
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleAction(req.id, "reject")}
                  className="rounded-lg bg-brand-emergency px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-red disabled:opacity-50 transition"
                >
                  {isBusy ? "…" : "Reject"}
                </button>
              </div>
            </div>
          ) : (
            <span className="text-xs text-brand-sub">{req.reviewNote || "—"}</span>
          )}
        </td>
      </tr>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink flex items-center gap-2">
            Unsuspend Requests
            {pending.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-brand-emergency px-2.5 py-0.5 text-xs font-semibold text-white">
                {pending.length}
              </span>
            )}
          </h1>
          <p className="text-brand-sub text-sm mt-1">
            Review and approve or reject reinstatement requests from self-deactivated users.
          </p>
        </div>
        <button
          type="button"
          onClick={loadRequests}
          className="shrink-0 rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-text hover:bg-brand-muted transition"
        >
          Refresh
        </button>
      </div>

      {err && (
        <div className="rounded-lg border border-brand-border bg-brand-muted/40 px-3 py-2 text-sm text-brand-accent">
          {err}
        </div>
      )}

      {/* Pending section */}
      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-sub">
          Pending ({pending.length})
        </h2>
        <div className="rounded-2xl bg-brand-card border border-brand-border overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-brand-bg text-left text-brand-sub">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3 hidden md:table-cell">Requested</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 hidden lg:table-cell">Reviewed At</th>
                <th className="px-4 py-3 text-right">Actions / Note</th>
              </tr>
            </thead>
            <tbody className="text-brand-text">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-brand-sub">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-sub border-t-transparent" />
                      <span>Loading…</span>
                    </div>
                  </td>
                </tr>
              ) : pending.length ? (
                pending.map((r) => <RequestRow key={r.id} req={r} />)
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-brand-sub">
                    No pending requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reviewed section */}
      {reviewed.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-sub">
            Reviewed ({reviewed.length})
          </h2>
          <div className="rounded-2xl bg-brand-card border border-brand-border overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-brand-bg text-left text-brand-sub">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3 hidden md:table-cell">Requested</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Reviewed At</th>
                  <th className="px-4 py-3 text-right">Note</th>
                </tr>
              </thead>
              <tbody className="text-brand-text">
                {reviewed.map((r) => (
                  <RequestRow key={r.id} req={r} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
