import { expect } from "@playwright/test";

// Seeded local test account from backend/src/data/users.json (local JSON store only).
export const TEST_CUSTOMER = { email: "user@giftingwellness.com", password: "user123" };

/** Collect console errors and uncaught exceptions so a test can assert there were none. */
export function trackErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const text = m.text();
    // Product images are third-party/uploaded files; a missing one is reported separately.
    if (/Failed to load resource/.test(text)) return;
    errors.push(`console: ${text}`);
  });
  return errors;
}

export async function clearStorage(page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
}

export async function expectNoHorizontalScroll(page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, "page should not scroll sideways").toBeLessThanOrEqual(clientWidth);
}

export async function signInAsCustomer(page) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill(TEST_CUSTOMER.email);
  await page.getByLabel("Password", { exact: true }).fill(TEST_CUSTOMER.password);
  await page.locator("form").getByRole("button", { name: /sign in/i }).last().click();
  await expect.poll(() => page.evaluate(() => Boolean(localStorage.getItem("shop_auth_token")))).toBe(true);
}

export const bagCount = (page) =>
  page.locator(".gw-header-main a[href='/cart'] .cart-item-count");

/** Open the product listing and wait until the catalogue request has settled. */
export async function gotoProducts(page, path = "/products") {
  const loaded = page.waitForResponse((r) => r.url().includes("/api/products") && r.ok());
  await page.goto(path);
  await loaded;
  await expect(page.locator(".product-card-luxury").first()).toBeVisible();
  // Dev mode (React StrictMode) fetches twice; let the second render land.
  await page.waitForTimeout(600);
}

/** Add the first card on the page to the bag, picking a size if it asks for one. */
export async function quickAddFirst(page) {
  const card = page.locator(".product-card-luxury").first();
  await card.hover();
  await card.locator(".product-quick-add-btn").click();
  const picker = card.locator(".product-quick-size-selector");
  if (await picker.isVisible()) {
    await picker.locator(".size-choice-btn").first().click();
  }
  return card;
}
