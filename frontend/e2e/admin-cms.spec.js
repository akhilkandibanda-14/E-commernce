import { test, expect } from "@playwright/test";

const ADMIN = "http://localhost:5174";
const API = "http://localhost:5001";

// Seeded local admin from backend/src/data/users.json (local JSON store only).
async function adminToken(request) {
  return (await getSession(request)).token;
}

// Sign in once per run (the login endpoint is rate-limited) and reuse the session.
let session = null;
async function getSession(request) {
  if (session) return session;
  const res = await request.post(`${API}/api/auth/login`, {
    data: { email: "admin@giftingwellness.com", password: "admin123", roleHint: "admin" },
  });
  const data = await res.json();
  expect(res.ok(), data.message).toBeTruthy();
  session = { token: data.token, user: data.user };
  return session;
}

async function signInAdmin(page) {
  const { token, user } = await getSession(page.request);
  await page.goto(`${ADMIN}/`);
  await page.evaluate(([t, u]) => {
    localStorage.setItem("shop_auth_token", t);
    localStorage.setItem("shop_auth_user", JSON.stringify(u));
  }, [token, user]);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Admin Privileges Required" })).toBeHidden();
}

test.describe("Admin: edit the client pages, users & visitors, products", () => {
  let savedHomePage;

  test.beforeAll(async ({ request }) => {
    const res = await request.get(`${API}/api/site-content`);
    savedHomePage = (await res.json()).content.homePage || {};
  });

  // Put the home page back exactly as it was, whatever the tests changed.
  test.afterAll(async ({ request }) => {
    const token = await adminToken(request);
    const sections = ["hero", "promoBanner", "sections"];
    const restore = {};
    for (const key of sections) restore[key] = savedHomePage[key] || {};
    await request.put(`${API}/api/site-content/home-page`, {
      headers: { Authorization: `Bearer ${token}` },
      data: restore,
    });
  });

  test("admin edits the hero text and image, and the shop shows it", async ({ page, request }) => {
    await signInAdmin(page);
    await page.goto(`${ADMIN}/admin/site-content`);
    await expect(page.getByRole("heading", { name: "Home page", exact: true })).toBeVisible();

    const hero = page.locator("details.gw-section-editor", { hasText: "Hero" }).first();
    await hero.locator("summary").click();
    await hero.getByLabel("Headline").fill("Gifts that say thank you properly.");
    await hero.getByLabel("Hero image").fill("/introImage.jpg");
    await expect(hero.getByText("Unsaved changes")).toBeVisible();
    await hero.getByRole("button", { name: "Save hero" }).click();
    await expect(hero.getByRole("status")).toContainText("Saved");

    const shop = await page.context().newPage();
    await shop.goto("http://localhost:5173/");
    await expect(shop.getByRole("heading", { level: 1 })).toHaveText("Gifts that say thank you properly.");
    await expect(shop.locator(".gw-hero-arch img")).toHaveAttribute("src", "/introImage.jpg");

    // An unsafe link is refused with a readable message.
    await hero.getByLabel("Main button link").fill("javascript:alert(1)");
    await hero.getByRole("button", { name: "Save hero" }).click();
    await expect(hero.getByRole("alert")).toContainText("must start with");
    void request;
  });

  test("admin hides and shows a home page section", async ({ page }) => {
    await signInAdmin(page);
    await page.goto(`${ADMIN}/admin/site-content`);
    const toggle = page.locator(".gw-visibility").getByLabel("Promotional banner");
    await toggle.uncheck();
    await expect(page.locator(".gw-visibility").getByRole("status")).toContainText("hidden");

    const shop = await page.context().newPage();
    await shop.goto("http://localhost:5173/");
    await expect(shop.locator(".gw-hero")).toBeVisible();
    await expect(shop.locator(".promotional-campaign-section")).toHaveCount(0);

    await toggle.check();
    await shop.reload();
    await expect(shop.locator(".promotional-campaign-section")).toBeVisible();
  });

  test("Users & visitors shows counts and the account list", async ({ page }) => {
    // Generate a couple of shop visits first.
    const shop = await page.context().newPage();
    await shop.goto("http://localhost:5173/");
    await shop.goto("http://localhost:5173/products");
    await shop.waitForTimeout(500);

    await signInAdmin(page);
    await page.getByRole("link", { name: /Users & Visitors/ }).click();
    await expect(page).toHaveURL(/\/admin\/users$/);
    await expect(page.getByRole("heading", { name: "Visitors", exact: true })).toBeVisible();
    const today = page.locator(".gw-stat", { hasText: "Visitors today" }).locator(".gw-stat-value");
    await expect(today).not.toHaveText("0");

    await expect(page.getByRole("heading", { name: "Accounts", exact: true })).toBeVisible();
    await page.getByLabel("Search").fill("user@giftingwellness.com");
    await expect(page.locator(".gw-users-table tbody tr")).toHaveCount(1);
    await expect(page.locator(".gw-users-table")).toContainText("user@giftingwellness.com");
  });

  test("admin edits an existing product from the catalogue", async ({ page, request }) => {
    const list = await (await request.get(`${API}/api/products?limit=5`)).json();
    const product = list.products[0];

    await signInAdmin(page);
    await page.goto(`${ADMIN}/admin`);
    await page.getByRole("link", { name: `Edit ${product.title}` }).first().click();
    await expect(page.getByRole("heading", { name: "Edit product" })).toBeVisible();
    const titleInput = page.locator("input").filter({ hasText: "" }).first();
    await expect(page.locator(`input[value="${product.title.replace(/"/g, '\\"')}"]`).first()).toBeVisible();

    const original = String(product.price);
    const priceInput = page.locator(`input[value="${original}"]`).first();
    await priceInput.fill(String(Number(product.price) + 1));
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("heading", { name: "Changes saved" })).toBeVisible();

    const after = await (await request.get(`${API}/api/products/${product.id}`)).json();
    expect(Number((after.product || after).price)).toBe(Number(product.price) + 1);

    // Put the price back.
    const token = await adminToken(request);
    await request.put(`${API}/api/products/${product.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { price: Number(product.price) },
    });
    void titleInput;
  });
});
