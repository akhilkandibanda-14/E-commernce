import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { userApp, adminApp } from "../src/server.js";
import fs from "fs";
import { getJwtSecret, JWT_ALGORITHM } from "../src/middleware/auth.js";
import { loadSiteContent, saveSiteContent } from "../src/data/siteContentStore.js";
import { ANALYTICS_FILE } from "../src/data/analyticsStore.js";

// Real HTTP servers on random ports so status codes like 204 behave exactly as in production.
const listen = (app) =>
  new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });

const sign = (claims) =>
  jwt.sign(claims, getJwtSecret(), { algorithm: JWT_ALGORITHM, expiresIn: "1h" });

const adminToken = sign({ id: "usr_admin_01", email: "admin@shop.co", role: "admin" });
const customerToken = sign({ id: "usr_user_01", email: "user@shop.co", role: "user" });

test("Admin CMS, users and analytics API", async (t) => {
  const userServer = await listen(userApp);
  const adminServer = await listen(adminApp);
  const userUrl = `http://127.0.0.1:${userServer.address().port}`;
  const adminUrl = `http://127.0.0.1:${adminServer.address().port}`;
  const call = (base, method, path, { body, token } = {}) =>
    fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

  // Put the real home page content and visit stats back exactly as they were.
  const savedHomePage = JSON.parse(JSON.stringify(loadSiteContent().homePage || {}));
  const savedAnalytics = fs.existsSync(ANALYTICS_FILE) ? fs.readFileSync(ANALYTICS_FILE, "utf-8") : null;
  t.after(async () => {
    userServer.close();
    adminServer.close();
    saveSiteContent({ ...loadSiteContent(), homePage: savedHomePage });
    await new Promise((r) => setTimeout(r, 3500)); // let the batched analytics write finish first
    if (savedAnalytics === null) fs.rmSync(ANALYTICS_FILE, { force: true });
    else fs.writeFileSync(ANALYTICS_FILE, savedAnalytics, "utf-8");
  });

  await t.test("home page edits require an admin", async () => {
    const anon = await call(adminUrl, "PUT", "/api/site-content/home-page", { body: { hero: { title: "x" } } });
    assert.equal(anon.status, 401);
    const customer = await call(adminUrl, "PUT", "/api/site-content/home-page", {
      body: { hero: { title: "x" } },
      token: customerToken,
    });
    assert.equal(customer.status, 403);
    const userPort = await call(userUrl, "PUT", "/api/site-content/home-page", {
      body: { hero: { title: "x" } },
      token: adminToken,
    });
    assert.equal(userPort.status, 403, "storefront port must not accept content edits");
  });

  await t.test("admin saves hero text, image and section visibility", async () => {
    const res = await call(adminUrl, "PUT", "/api/site-content/home-page", {
      token: adminToken,
      body: {
        hero: { title: "  Test hero  ", image: "/uploads/hero.jpg", promises: ["One", "", "Two"], unknown: "drop me" },
        sections: { promoBanner: false },
      },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.homePage.hero.title, "Test hero");
    assert.equal(data.homePage.hero.image, "/uploads/hero.jpg");
    assert.deepEqual(data.homePage.hero.promises, ["One", "Two"]);
    assert.equal(data.homePage.hero.unknown, undefined);
    assert.equal(data.homePage.sections.promoBanner, false);

    const pub = await (await call(userUrl, "GET", "/api/site-content")).json();
    assert.equal(pub.content.homePage.hero.title, "Test hero");
  });

  await t.test("unsafe links and unknown sections are rejected", async () => {
    const bad = await call(adminUrl, "PUT", "/api/site-content/home-page", {
      token: adminToken,
      body: { hero: { primaryCtaLink: "javascript:alert(1)" } },
    });
    assert.equal(bad.status, 400);
    const unknown = await call(adminUrl, "PUT", "/api/site-content/home-page", {
      token: adminToken,
      body: { footerHack: {} },
    });
    assert.equal(unknown.status, 400);
  });

  await t.test("visits are counted and summarised for admins only", async () => {
    const before = await (await call(adminUrl, "GET", "/api/admin/analytics", { token: adminToken })).json();
    const v1 = await call(userUrl, "POST", "/api/analytics/visit", { body: { visitorId: "test-visitor-aaaa", path: "/products?search=secret" } });
    assert.equal(v1.status, 204);
    await call(userUrl, "POST", "/api/analytics/visit", { body: { visitorId: "test-visitor-aaaa", path: "/" } });
    await call(userUrl, "POST", "/api/analytics/visit", { body: { visitorId: "test-visitor-bbbb", path: "/" } });

    const bad = await call(userUrl, "POST", "/api/analytics/visit", { body: { visitorId: "x", path: "nope" } });
    assert.equal(bad.status, 400);

    const denied = await call(adminUrl, "GET", "/api/admin/analytics", { token: customerToken });
    assert.equal(denied.status, 403);

    const after = await (await call(adminUrl, "GET", "/api/admin/analytics", { token: adminToken })).json();
    assert.equal(after.today.views - before.today.views, 3);
    assert.ok(after.today.visitors >= 2);
    assert.equal(after.daily.length, 30);
    assert.ok(after.topPages.every((p) => !p.path.includes("?")), "query strings are never stored");
  });

  await t.test("user list is admin-only and never exposes password hashes", async () => {
    const denied = await call(adminUrl, "GET", "/api/admin/users", { token: customerToken });
    assert.equal(denied.status, 403);
    const res = await call(adminUrl, "GET", "/api/admin/users", { token: adminToken });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.total >= 1);
    assert.ok(data.users.every((u) => u.passwordHash === undefined));
    assert.ok(data.users.every((u) => typeof u.orders === "number" && typeof u.totalSpent === "number"));
  });
});
