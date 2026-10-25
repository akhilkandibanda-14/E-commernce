import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../src/server.js";
import { JWT_SECRET } from "../src/middleware/auth.js";

const getAdminToken = () => {
  return jwt.sign(
    { id: "usr_admin_02", email: "admin@giftingwellness.com", role: "admin", name: "Admin" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
};

const getUserToken = () => {
  return jwt.sign(
    { id: "usr_user_02", email: "user@giftingwellness.com", role: "user", name: "Corporate Client" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
};

test("Catalogue Requests API Suite", async (t) => {
  const app = createApp({ isUserPort: false, port: 0 });
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  t.after(() => {
    server.close();
  });

  let createdRequestId = null;

  await t.test("1. Reject catalogue request without email", async () => {
    const res = await fetch(`${baseUrl}/api/catalogue-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Buyer", notes: "Please send" }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  await t.test("2. Successfully submit a catalogue request", async () => {
    const res = await fetch(`${baseUrl}/api/catalogue-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Priya Sharma",
        email: "priya@techcorp.in",
        phone: "+91 98765 43210",
        company: "TechCorp India",
        catalogueId: "corp-master-2026",
        catalogueTitle: "Corporate Gifting Master Catalogue 2026",
        notes: "I need to download the catalogue for Diwali corporate gifting.",
      }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.requestId);
    assert.ok(data.request);
    assert.equal(data.request.name, "Priya Sharma");
    assert.equal(data.request.email, "priya@techcorp.in");
    assert.equal(data.request.status, "pending");
    createdRequestId = data.requestId;
  });

  await t.test("3. Customer cannot access GET /api/catalogue-requests (403)", async () => {
    const res = await fetch(`${baseUrl}/api/catalogue-requests`, {
      headers: { Authorization: `Bearer ${getUserToken()}` },
    });
    assert.equal(res.status, 403);
  });

  await t.test("4. Admin GET /api/catalogue-requests retrieves the submitted request", async () => {
    const res = await fetch(`${baseUrl}/api/catalogue-requests`, {
      headers: { Authorization: `Bearer ${getAdminToken()}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.requests));
    const found = data.requests.find((r) => r.requestId === createdRequestId);
    assert.ok(found, "Newly submitted catalogue request must be in admin list");
    assert.equal(found.company, "TechCorp India");
  });

  await t.test("5. Admin PATCH /api/catalogue-requests/:id/status updates status to approved/sent", async () => {
    const res = await fetch(`${baseUrl}/api/catalogue-requests/${createdRequestId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAdminToken()}`,
      },
      body: JSON.stringify({
        status: "approved",
        adminNotes: "Sent PDF catalogue link via email and WhatsApp.",
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.request.status, "approved");
    assert.equal(data.request.adminNotes, "Sent PDF catalogue link via email and WhatsApp.");
  });

  await t.test("6. Admin DELETE /api/catalogue-requests/:id deletes the request", async () => {
    const res = await fetch(`${baseUrl}/api/catalogue-requests/${createdRequestId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getAdminToken()}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);

    // Verify it's gone
    const checkRes = await fetch(`${baseUrl}/api/catalogue-requests`, {
      headers: { Authorization: `Bearer ${getAdminToken()}` },
    });
    const checkData = await checkRes.json();
    const found = checkData.requests.find((r) => r.requestId === createdRequestId);
    assert.equal(found, undefined);
  });
});
