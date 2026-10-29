import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { userApp, adminApp } from "../src/server.js";
import { getJwtSecret, JWT_ALGORITHM } from "../src/middleware/auth.js";
import { resetSiteContentToDefaults } from "../src/data/siteContentStore.js";

// Helper to make mock requests against Express apps
const makeRequest = async (app, method, url, { body, headers = {} } = {}) => {
  const reqListeners = app._router;
  return new Promise((resolve) => {
    const req = {
      method,
      url,
      originalUrl: url,
      headers: {
        "content-type": "application/json",
        ...headers,
      },
      body: body || {},
    };

    let statusCode = 200;
    const responseHeaders = {};
    let responseBody = "";

    const res = {
      statusCode: 200,
      status(code) {
        statusCode = code;
        this.statusCode = code;
        return this;
      },
      setHeader(k, v) {
        responseHeaders[k.toLowerCase()] = v;
      },
      getHeader(k) {
        return responseHeaders[k.toLowerCase()];
      },
      json(data) {
        responseBody = JSON.stringify(data);
        resolve({
          status: statusCode,
          headers: responseHeaders,
          body: data,
        });
      },
      send(data) {
        responseBody = data;
        resolve({
          status: statusCode,
          headers: responseHeaders,
          body: data,
        });
      },
      on() {},
      emit() {},
    };

    app(req, res);
  });
};

const getAdminToken = () => {
  const secret = getJwtSecret();
  return jwt.sign(
    { id: "usr_admin_01", email: "admin@shop.co", role: "admin" },
    secret,
    { algorithm: JWT_ALGORITHM, expiresIn: "1h" }
  );
};

const getCustomerToken = () => {
  const secret = getJwtSecret();
  return jwt.sign(
    { id: "usr_user_01", email: "user@shop.co", role: "user" },
    secret,
    { algorithm: JWT_ALGORITHM, expiresIn: "1h" }
  );
};

test("Site Content & Brands API Suite", async (t) => {
  // Ensure starting with defaults
  resetSiteContentToDefaults();

  await t.test("1. GET /api/site-content returns 200 with default brands and aboutUs", async () => {
    const res = await makeRequest(userApp, "GET", "/api/site-content");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.content.brands));
    assert.ok(res.body.content.brands.length >= 20);
    assert.ok(res.body.content.aboutUs.title);
  });

  await t.test("2. User Port rejects POST /api/site-content/brands with 403", async () => {
    const adminToken = getAdminToken();
    const res = await makeRequest(userApp, "POST", "/api/site-content/brands", {
      headers: { authorization: `Bearer ${adminToken}` },
      body: { name: "TestBrand", category: "Test" },
    });
    assert.equal(res.status, 403);
    assert.equal(res.body.error, "FORBIDDEN_PORT_MUTATION");
  });

  await t.test("3. Admin Port rejects unauthenticated brand creation with 401", async () => {
    const res = await makeRequest(adminApp, "POST", "/api/site-content/brands", {
      body: { name: "Unauthorized Brand" },
    });
    assert.equal(res.status, 401);
  });

  await t.test("4. Admin Port rejects customer role from mutating content with 403", async () => {
    const custToken = getCustomerToken();
    const res = await makeRequest(adminApp, "POST", "/api/site-content/brands", {
      headers: { authorization: `Bearer ${custToken}` },
      body: { name: "Customer Brand" },
    });
    assert.equal(res.status, 403);
  });

  await t.test("5. Admin Port successfully adds a new brand", async () => {
    const adminToken = getAdminToken();
    const res = await makeRequest(adminApp, "POST", "/api/site-content/brands", {
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        name: "Acme Luxury Tech",
        category: "Smart Gadgets",
        tag: "New Arrival",
        description: "Premium corporate smart gadgets",
      },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.brand.name, "Acme Luxury Tech");
    assert.equal(res.body.brand.category, "Smart Gadgets");
    assert.equal(res.body.brand.tag, "New Arrival");

    // Verify it is now visible via GET on User Port!
    const userRes = await makeRequest(userApp, "GET", "/api/site-content");
    const found = userRes.body.content.brands.find((b) => b.name === "Acme Luxury Tech");
    assert.ok(found);
  });

  await t.test("6. Admin Port successfully edits a brand", async () => {
    const adminToken = getAdminToken();
    const listRes = await makeRequest(adminApp, "GET", "/api/site-content");
    const target = listRes.body.content.brands.find((b) => b.name === "Acme Luxury Tech");
    assert.ok(target);

    const editRes = await makeRequest(adminApp, "PUT", `/api/site-content/brands/${target.id}`, {
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        category: "Ultra Executive Audio",
        tag: "Exclusive",
      },
    });
    assert.equal(editRes.status, 200);
    assert.equal(editRes.body.brand.category, "Ultra Executive Audio");
    assert.equal(editRes.body.brand.tag, "Exclusive");
  });

  await t.test("7. Admin Port updates About Us content", async () => {
    const adminToken = getAdminToken();
    const res = await makeRequest(adminApp, "PUT", "/api/site-content/about-us", {
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        title: "Crafting Unforgettable Corporate Experiences",
        kicker: "Leading B2B Gifting Partner",
      },
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.aboutUs.title, "Crafting Unforgettable Corporate Experiences");

    // Verify User Port receives updated About Us
    const userRes = await makeRequest(userApp, "GET", "/api/site-content");
    assert.equal(userRes.body.content.aboutUs.title, "Crafting Unforgettable Corporate Experiences");
  });

  await t.test("8. Admin Port deletes a brand", async () => {
    const adminToken = getAdminToken();
    const listRes = await makeRequest(adminApp, "GET", "/api/site-content");
    const target = listRes.body.content.brands.find((b) => b.name === "Acme Luxury Tech");
    assert.ok(target);

    const delRes = await makeRequest(adminApp, "DELETE", `/api/site-content/brands/${target.id}`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(delRes.status, 200);
    assert.equal(delRes.body.success, true);

    // Verify it is gone from User Port
    const userRes = await makeRequest(userApp, "GET", "/api/site-content");
    const found = userRes.body.content.brands.find((b) => b.name === "Acme Luxury Tech");
    assert.equal(found, undefined);
  });

  await t.test("9. User Port rejects PUT /api/site-content/navigation with 403", async () => {
    const adminToken = getAdminToken();
    const res = await makeRequest(userApp, "PUT", "/api/site-content/navigation", {
      headers: { authorization: `Bearer ${adminToken}` },
      body: { brandLogo: { text: "FORBIDDEN" } },
    });
    assert.equal(res.status, 403);
    assert.equal(res.body.error, "FORBIDDEN_PORT_MUTATION");
  });

  await t.test("10. Admin Port successfully updates whole navigation (logo and CTA buttons)", async () => {
    const adminToken = getAdminToken();
    const res = await makeRequest(adminApp, "PUT", "/api/site-content/navigation", {
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        brandLogo: {
          text: "HERITAGE CO.",
          subtext: "CURATED GIFTING",
          icon: "fa-solid fa-gem",
        },
        actions: {
          downloadCatalogues: {
            enabled: true,
            label: "Get PDF Brochure",
            icon: "fa-solid fa-file-pdf",
          },
          bulkEnquiry: {
            enabled: false,
            label: "Wholesale Inquiry",
            icon: "fa-solid fa-envelope",
          },
        },
      },
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.navigation.brandLogo.text, "HERITAGE CO.");
    assert.equal(res.body.navigation.actions.downloadCatalogues.label, "Get PDF Brochure");
    assert.equal(res.body.navigation.actions.bulkEnquiry.enabled, false);

    // Verify User Port receives updated navigation immediately!
    const userRes = await makeRequest(userApp, "GET", "/api/site-content");
    assert.equal(userRes.body.content.navigation.brandLogo.text, "HERITAGE CO.");
    assert.equal(userRes.body.content.navigation.actions.bulkEnquiry.enabled, false);
  });

  await t.test("11. Admin Port adds, updates, and deletes navigation items", async () => {
    const adminToken = getAdminToken();

    // Add new nav item
    const addRes = await makeRequest(adminApp, "POST", "/api/site-content/navigation/items", {
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        label: "Corporate Hampers",
        path: "/products?category=hampers",
        icon: "fa-solid fa-basket-shopping",
        badge: "EXCLUSIVE",
      },
    });
    assert.equal(addRes.status, 201);
    assert.equal(addRes.body.item.label, "Corporate Hampers");
    const newItemId = addRes.body.item.id;

    // Toggle visibility or edit item
    const editRes = await makeRequest(adminApp, "PUT", `/api/site-content/navigation/items/${newItemId}`, {
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        label: "VIP Luxury Hampers",
        enabled: false, // Hide item
      },
    });
    assert.equal(editRes.status, 200);
    assert.equal(editRes.body.item.label, "VIP Luxury Hampers");
    assert.equal(editRes.body.item.enabled, false);

    // Delete nav item
    const delRes = await makeRequest(adminApp, "DELETE", `/api/site-content/navigation/items/${newItemId}`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(delRes.status, 200);
    assert.equal(delRes.body.success, true);
  });

  await t.test("12. Admin Port adds, updates, and deletes a gifting category", async () => {
    const adminToken = getAdminToken();

    // 1. Add Category
    const addCatRes = await makeRequest(adminApp, "POST", "/api/site-content/categories", {
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        name: "Eco Green Kits",
        icon: "fa-solid fa-seedling",
        badge: "Eco Friendly",
        leadTime: "2–4 Days",
        description: "Zero waste and sustainable corporate gifts",
      },
    });
    assert.equal(addCatRes.status, 201);
    assert.equal(addCatRes.body.category.name, "Eco Green Kits");
    const catId = addCatRes.body.category.id;

    // 2. Update Category
    const editCatRes = await makeRequest(adminApp, "PUT", `/api/site-content/categories/${catId}`, {
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        badge: "100% Organic",
        leadTime: "48 Hours",
      },
    });
    assert.equal(editCatRes.status, 200);
    assert.equal(editCatRes.body.category.badge, "100% Organic");

    // Verify on User Port
    const userRes = await makeRequest(userApp, "GET", "/api/site-content");
    const foundCat = userRes.body.content.giftingCategories.find((c) => c.id === catId);
    assert.ok(foundCat);
    assert.equal(foundCat.badge, "100% Organic");

    // 3. Delete Category
    const delCatRes = await makeRequest(adminApp, "DELETE", `/api/site-content/categories/${catId}`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(delCatRes.status, 200);
  });

  await t.test("13. Admin Port adds, updates, and deletes subcategories in a category", async () => {
    const adminToken = getAdminToken();

    // 1. Add Subcategory to 'bags'
    const addSubRes = await makeRequest(adminApp, "POST", "/api/site-content/categories/bags/subcategories", {
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        name: "Laptop Sleeves",
        query: "Laptop Sleeve",
        icon: "fa-solid fa-laptop",
      },
    });
    assert.equal(addSubRes.status, 201);
    assert.equal(addSubRes.body.subcategory.name, "Laptop Sleeves");
    const subId = addSubRes.body.subcategory.id;

    // 2. Update Subcategory
    const editSubRes = await makeRequest(adminApp, "PUT", `/api/site-content/categories/bags/subcategories/${subId}`, {
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        name: "Padded Laptop Sleeves",
      },
    });
    assert.equal(editSubRes.status, 200);
    assert.equal(editSubRes.body.subcategory.name, "Padded Laptop Sleeves");

    // 3. Delete Subcategory
    const delSubRes = await makeRequest(adminApp, "DELETE", `/api/site-content/categories/bags/subcategories/${subId}`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(delSubRes.status, 200);
  });

  await t.test("14. Admin Port updates heroCarousel slides with uploaded images and customer port reads it", async () => {
    const adminToken = getAdminToken();

    const carouselPayload = {
      heroCarousel: {
        enabled: true,
        autoplay: true,
        interval: 6,
        slides: [
          {
            badge: "Executive Hampers 2026",
            title: "Handcrafted Luxury Gift Sets",
            subtitle: "Custom debossed leather planners and vacuum insulated flasks",
            primaryCtaText: "Explore Gifts",
            primaryCtaLink: "/products",
            secondaryCtaText: "Send Enquiry",
            secondaryCtaLink: "/cart",
            image: "/uploads/carousel-slide-test.jpg",
            imageAlt: "Luxury Gift Sets",
            tagTitle: "Pan India Delivery",
            tagText: "Within 3 business days",
            isActive: true,
          },
        ],
      },
    };

    const updateRes = await makeRequest(adminApp, "PUT", "/api/site-content/home-page", {
      headers: { authorization: `Bearer ${adminToken}` },
      body: carouselPayload,
    });

    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.success, true);
    assert.equal(updateRes.body.homePage.heroCarousel.interval, 6);
    assert.equal(updateRes.body.homePage.heroCarousel.slides.length, 1);
    assert.equal(updateRes.body.homePage.heroCarousel.slides[0].badge, "Executive Hampers 2026");
    assert.equal(updateRes.body.homePage.heroCarousel.slides[0].image, "/uploads/carousel-slide-test.jpg");

    // Verify Customer port reads updated carousel content
    const customerGetRes = await makeRequest(userApp, "GET", "/api/site-content");
    assert.equal(customerGetRes.status, 200);
    assert.equal(customerGetRes.body.content.homePage.heroCarousel.slides[0].badge, "Executive Hampers 2026");
  });

  // Cleanup: restore defaults
  resetSiteContentToDefaults();
});

