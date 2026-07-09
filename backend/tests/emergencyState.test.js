import test from "node:test";
import assert from "node:assert/strict";
import { getActiveRequest } from "../src/services/emergencyState.js";

test("selects the latest active request and ignores completed ones", () => {
  const requests = [
    { id: "completed", status: "completed", createdAt: "2024-01-01T00:00:00.000Z" },
    { id: "pending", status: "pending", createdAt: "2024-01-02T00:00:00.000Z" },
    { id: "accepted", status: "accepted", createdAt: "2024-01-03T00:00:00.000Z" },
  ];

  const active = getActiveRequest(requests);
  assert.ok(active);
  assert.equal(active.id, "accepted");
});

test("returns null when no active request exists", () => {
  const requests = [
    { id: "completed-1", status: "completed", createdAt: "2024-01-01T00:00:00.000Z" },
    { id: "completed-2", status: "completed", createdAt: "2024-01-02T00:00:00.000Z" },
  ];

  assert.equal(getActiveRequest(requests), null);
});
