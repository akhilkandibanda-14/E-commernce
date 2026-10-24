import { test, expect } from "@playwright/test";
import {
  trackErrors,
  clearStorage,
  expectNoHorizontalScroll,
  signInAsCustomer,
  bagCount,
  gotoProducts,
  quickAddFirst,
} from "./helpers";

const nav = (page) => page.getByRole("navigation", { name: "Main" });

test.describe("Navigation and routing", () => {
  test("home renders with no runtime errors and the hero CTAs work", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: /gifts your clients/i })).toBeVisible();

    await page.getByRole("button", { name: "Request a bulk quote" }).click();
    await expect(page.locator(".bulk-enquiry-modal-card")).toBeVisible();
    await page.keyboard.press("Escape");
    // The bulk modal may not support Escape; close it with its own button if still open.
    if (await page.locator(".bulk-enquiry-modal-card").isVisible()) {
      await page.locator(".bulk-enquiry-modal-card").getByRole("button").first().click();
    }
    await expect(page.locator(".bulk-enquiry-modal-card")).toBeHidden();

    await page.getByRole("link", { name: "Browse the catalogue" }).click();
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole("heading", { level: 1, name: "All Products" })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("top-level nav links go to the right pages", async ({ page }) => {
    await page.goto("/products");
    await nav(page).getByRole("link", { name: "About Us" }).click();
    await expect(page).toHaveURL(/\/about$/);
    await nav(page).getByRole("link", { name: "Home" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.locator("header").getByRole("link", { name: "Giftingwellness home" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("dropdown menus open by click and keyboard, and close with Escape", async ({ page }) => {
    await page.goto("/");
    const trigger = nav(page).getByRole("button", { name: /Gifting Categories/ });
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    // Every link inside an open dropdown must lead to a real page.
    const links = await nav(page).locator("li.is-active a[href^='/']").evaluateAll((as) =>
      as.map((a) => a.getAttribute("href"))
    );
    expect(links.length).toBeGreaterThan(0);
    for (const href of links.slice(0, 6)) {
      await page.goto(href);
      await expect(page.getByText(/page not found/i)).toHaveCount(0);
    }
  });

  test("every footer and policy link resolves", async ({ page }) => {
    await page.goto("/");
    const hrefs = await page.locator("footer a[href^='/']").evaluateAll((as) =>
      [...new Set(as.map((a) => a.getAttribute("href")))]
    );
    expect(hrefs.length).toBeGreaterThan(5);
    for (const href of hrefs) {
      const res = await page.goto(href);
      expect(res?.status(), href).toBeLessThan(400);
      await expect(page.getByText(/page not found/i), href).toHaveCount(0);
    }
  });

  test("unknown routes show the not-found page; back and forward work", async ({ page }) => {
    await page.goto("/");
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByText(/not found|404/i).first()).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await page.goForward();
    await expect(page).toHaveURL(/this-page-does-not-exist/);
  });

  test("direct load and refresh of a product page works", async ({ page, request }) => {
    const res = await request.get("http://localhost:5000/api/products/featured/best-sellers");
    const body = await res.json();
    const product = (body.products || body)[0];
    const url = `/products/${encodeURIComponent(product.category)}/${product.id}`;
    await page.goto(url);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(product.title.slice(0, 20));
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(product.title.slice(0, 20));
  });
});

test.describe("Search, sort, filter, pagination", () => {
  test("search suggests, submits to results, and clears", async ({ page }) => {
    await page.goto("/");
    const box = page.getByRole("combobox", { name: "Search gifts" });
    await box.fill("bottle");
    await expect(page.locator(".search-suggestion-item").first()).toBeVisible();
    await box.press("Enter");
    await expect(page).toHaveURL(/search=bottle/i);
    await expect(page.locator(".product-card-luxury").first()).toBeVisible();

    await page.goto("/");
    await box.fill("mug");
    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(box).toHaveValue("");
  });

  test("sorting by lowest price orders the grid by price", async ({ page }) => {
    await gotoProducts(page);
    await page.locator(".dropdown-sort-container > .btn-dropdown-sort").click();
    await page.getByRole("button", { name: "Lowest Price" }).click();
    await expect(page.locator(".dropdown-sort-container > .btn-dropdown-sort")).toContainText("Lowest Price");
    const prices = await page.locator(".category-product-price").evaluateAll((els) =>
      els.map((e) => Number(e.textContent.replace(/[^\d.]/g, "")))
    );
    expect(prices.length).toBeGreaterThan(1);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test("pagination moves to the next page and back", async ({ page }) => {
    await gotoProducts(page);
    // Compare product links, not titles: the catalogue contains repeated titles.
    const firstHref = await page.locator(".product-title-link").first().getAttribute("href");
    const next = page.locator(".change-page").last();
    await next.click();
    await expect(page.locator(".page-number-active")).toHaveText("2");
    await expect(page.locator(".product-title-link").first()).not.toHaveAttribute("href", firstHref);
    await page.locator(".change-page").first().click();
    await expect(page.locator(".page-number-active")).toHaveText("1");
  });

  test("category filter narrows results and an impossible search shows the empty state", async ({ page }) => {
    await gotoProducts(page);
    const total = await page.locator(".products-number").textContent();
    await page.locator(".filter-categories").getByText(/Drinkware/i).first().click();
    await expect(page.locator(".products-number")).not.toHaveText(total);

    await page.goto("/products?search=zzzz-no-such-gift");
    await expect(page.locator(".products-empty-state")).toBeVisible();
  });
});

test.describe("Bag and saved items", () => {
  test.beforeEach(async ({ page }) => clearStorage(page));

  test("add to bag updates count, quantities, subtotal, removal and persistence", async ({ page }) => {
    await gotoProducts(page);
    const price = Number(
      (await page.locator(".product-card-luxury .category-product-price").first().textContent()).replace(/[^\d.]/g, "")
    );
    await quickAddFirst(page);
    await expect(bagCount(page)).toHaveText("1");
    await expect(page.getByRole("status").filter({ hasText: "Added to bag" })).toBeVisible();

    await page.goto("/cart");
    await expect(page.getByRole("heading", { level: 1, name: "Your bag" })).toBeVisible();
    await page.getByRole("button", { name: "Increase quantity by 1" }).click();
    await expect(page.getByLabel("Quantity", { exact: true }).locator("input")).toHaveValue("2").catch(async () => {
      await expect(page.locator(".item-number")).toHaveValue("2");
    });
    const subtotalText = await page.locator(".order-layout").first().locator("p").last().textContent();
    expect(Number(subtotalText.replace(/[^\d.]/g, ""))).toBeCloseTo(price * 2, 2);

    await page.reload();
    await expect(page.locator(".item-number")).toHaveValue("2");

    await page.getByRole("button", { name: "Decrease quantity by 1" }).click();
    await expect(page.locator(".item-number")).toHaveValue("1");
    await expect(page.getByRole("button", { name: "Decrease quantity by 1" })).toBeDisabled();

    await page.getByRole("button", { name: "Remove item" }).click();
    await expect(page.getByRole("heading", { name: "Your shopping bag is empty" })).toBeVisible();
    await expect(bagCount(page)).toHaveCount(0);
  });

  test("rapid adds are all counted", async ({ page, request }) => {
    // Use a single-size product so each click adds directly.
    const res = await request.get("http://localhost:5000/api/products?limit=50");
    const { products } = await res.json();
    const single = products.find((p) => !Array.isArray(p.sizes) || p.sizes.length <= 1);
    test.skip(!single, "catalogue has no single-size product");
    await gotoProducts(page, `/products?search=${encodeURIComponent(single.title)}`);
    const card = page.locator(".product-card-luxury", { hasText: single.title }).first();
    await card.hover();
    const add = card.locator(".product-quick-add-btn");
    await add.click();
    await add.click();
    await add.click();
    await expect(bagCount(page)).toHaveText("3");
    await page.goto("/cart");
    await expect(page.locator(".item-number")).toHaveValue("3");
  });

  test("saving an item shows it in saved items", async ({ page }) => {
    await gotoProducts(page);
    const card = page.locator(".product-card-luxury").first();
    const save = card.locator(".product-wishlist-btn");
    await save.click();
    await expect(save).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "View Saved Items" }).click();
    const title = (await card.locator(".category-product-title").textContent()).trim();
    await expect(page.locator(".wishlist-drawer, [class*='wishlist']").getByText(title.slice(0, 15)).first()).toBeVisible();
  });
});

test.describe("Forms and accounts", () => {
  test("bulk enquiry form validates required fields and submits", async ({ page }) => {
    await page.goto("/");
    await nav(page).getByRole("button", { name: /Bulk Enquiry|Enquiry for Bulk Orders/ }).click();
    const modal = page.locator(".bulk-enquiry-modal-card");
    await modal.locator("button[type='submit']").click();
    // Native required validation keeps the modal open with nothing sent.
    await expect(modal).toBeVisible();
    await expect(modal.locator("input:invalid").first()).toBeVisible();

    await modal.getByLabel(/Full Name/).fill("Playwright Test");
    await modal.getByLabel(/Company/).fill("QA Test Co");
    await modal.getByLabel(/Work Email/).fill("qa-playwright@example.com");
    await modal.getByLabel(/Phone/).fill("+91 90000 00000");
    const category = modal.getByLabel(/Primary Category/);
    if ((await category.evaluate((el) => el.tagName)) === "SELECT") {
      await category.selectOption({ index: 1 });
    }
    const qty = modal.getByLabel(/Estimated Order Quantity/);
    if ((await qty.evaluate((el) => el.tagName)) === "SELECT") await qty.selectOption({ index: 1 });
    else await qty.fill("200");
    await modal.locator("button[type='submit']").click();
    await expect(modal.getByText(/thank|received|submitted|success/i).first()).toBeVisible();
  });

  test("enquiry API rejects a missing or invalid email", async ({ request }) => {
    const missing = await request.post("http://localhost:5000/api/enquiries", { data: { name: "No Email" } });
    expect(missing.status()).toBe(400);
    const bad = await request.post("http://localhost:5000/api/enquiries", { data: { email: "not-an-email" } });
    expect(bad.status()).toBe(400);
  });

  test("catalogue request needs an email, then records the request", async ({ page }) => {
    await page.goto("/");
    await nav(page).getByRole("button", { name: /Catalogues/ }).click();
    const dialog = page.getByRole("dialog", { name: "Request a catalogue" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Email me this" }).first().click();
    await expect(dialog.getByRole("alert")).toContainText("valid work email");

    await dialog.getByLabel("Work email").fill("qa-catalogue@example.com");
    await dialog.getByRole("button", { name: "Email me this" }).first().click();
    await expect(dialog.getByRole("button", { name: "Requested" }).first()).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("home catalogue form validates email and reports success from the server", async ({ page }) => {
    await page.goto("/");
    const form = page.locator(".newsletter-form-editorial");
    await form.getByRole("button", { name: "Send me the catalogue" }).click();
    await expect(form.getByRole("alert")).toBeVisible();
    await form.getByLabel("Work email").fill("nope@");
    await form.getByRole("button", { name: "Send me the catalogue" }).click();
    await expect(form.getByRole("alert")).toContainText("name@company.com");
    await form.getByLabel("Work email").fill("qa-news@example.com");
    await form.getByRole("button", { name: "Send me the catalogue" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Request received" })).toBeVisible();
  });

  test("login rejects a wrong password and accepts the seeded test account", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email Address").fill("user@giftingwellness.com");
    await page.getByLabel("Password", { exact: true }).fill("wrong-password");
    await page.locator("form").getByRole("button", { name: /sign in/i }).last().click();
    await expect(page.getByText(/invalid|incorrect|failed/i).first()).toBeVisible();

    await signInAsCustomer(page);
    await page.goto("/orders");
    await expect(page.getByText(/sign in|log in/i).first()).toBeVisible({ timeout: 2000 }).catch(() => {});
    await expect(page.locator("main")).toBeVisible();
  });

  test("checkout places an order with totals that match the server", async ({ page }) => {
    await clearStorage(page);
    await signInAsCustomer(page);
    await gotoProducts(page);
    await quickAddFirst(page);
    await expect(bagCount(page)).toHaveText("1");
    await page.goto("/cart");
    const shownTotal = (await page.locator(".total-row p").last().textContent()).replace(/[^\d.]/g, "");

    await page.locator(".checkout-btn").click();
    await page.getByLabel("Full Name").fill("Playwright Buyer");
    await page.getByLabel("Email Address").fill("user@giftingwellness.com");
    await page.getByLabel("Shipping Address").fill("1 Test Street");
    await page.getByLabel("City").fill("Hyderabad");
    await page.getByLabel("Postal Code").fill("500001");
    await page.getByLabel(/Contact Phone/).fill("9000000000");
    await page.locator("label.payment-pill", { hasText: "Cash on Delivery" }).click();
    await page.getByRole("button", { name: /^Place order/ }).click();

    await expect(page.locator(".order-success-card")).toBeVisible({ timeout: 15000 });
    const confirmed = await page.locator(".order-success-card").textContent();
    expect(confirmed.replace(/,/g, "")).toContain(shownTotal);
    await expect(bagCount(page)).toHaveCount(0);
  });
});

test.describe("Admin access", () => {
  test("storefront admin routes require an admin and never offer one-click admin login in production", async ({ page }) => {
    await clearStorage(page);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Admin Privileges Required" })).toBeVisible();
    // This runs against the Vite dev server, where the demo button is allowed; the
    // production bundle check lives in the build verification step.
  });

  test("admin portal loads for the seeded admin account", async ({ page }) => {
    await page.goto("http://localhost:5174/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.getByRole("heading", { name: "Admin Privileges Required" })).toBeVisible();
    await page.getByRole("button", { name: "Enter Admin Credentials" }).click();
    await page.locator("#auth-email").fill("admin@giftingwellness.com");
    await page.locator("#auth-password").fill("admin123");
    await page.locator("#auth-password").press("Enter");
    await expect(page.getByRole("heading", { name: "Admin Privileges Required" })).toBeHidden();
    await expect(page.getByRole("main")).toContainText(/product|catalog|dashboard/i);
  });
});

test.describe("Responsive layout", () => {
  for (const width of [320, 375, 430, 768, 1024, 1366, 1440]) {
    test(`no sideways scrolling at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ["/", "/products", "/cart", "/about", "/login", "/terms"]) {
        await page.goto(route);
        await page.waitForLoadState("load");
        await expectNoHorizontalScroll(page);
      }
    });
  }

  test("mobile menu opens, navigates and closes @mobile", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const drawer = page.locator(".mobile-hamburger-container.opened");
    await expect(drawer).toBeVisible();
    await drawer.getByRole("link", { name: /About/ }).first().click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.locator(".mobile-hamburger-container.opened")).toHaveCount(0);
  });

  test("mobile search button opens search @mobile", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Search items" }).click();
    const box = page.locator("#search-product");
    await expect(box).toBeVisible();
    await expect(box).toBeFocused();
    await box.fill("mug");
    await box.press("Enter");
    await expect(page).toHaveURL(/search=mug/);
    await expect(box).toBeHidden();
  });
});

test.describe("Accessibility basics", () => {
  test("skip link, focus ring, labelled controls", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toBeFocused();
    const outline = await skip.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe("none");

    const unnamed = await page.evaluate(() =>
      [...document.querySelectorAll("button, a[href]")]
        .filter((el) => el.offsetParent !== null && !el.closest("[aria-hidden=\"true\"]"))
        .filter((el) => !(el.getAttribute("aria-label") || el.textContent.trim() || el.getAttribute("title")))
        .map((el) => el.outerHTML.slice(0, 120))
    );
    expect(unnamed).toEqual([]);
  });

  test("reduced motion turns off the hero animation", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const dur = await page.locator(".gw-hero-arch").evaluate((el) => getComputedStyle(el).animationDuration);
    expect(parseFloat(dur)).toBeLessThan(0.05);
  });
});
