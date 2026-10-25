import express from "express";
import { requireAdmin, getClerkClient, isEmailAdmin } from "../middleware/auth.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";
import { usersStore } from "../data/users.js";
import { getAllOrders } from "../data/ordersStore.js";
import { getAllEnquiries, getAllQuotes } from "../data/quotesStore.js";
import { recordVisit, getVisitSummary } from "../data/analyticsStore.js";

// Routes behind the admin "Users & visitors" page, plus the public visit beacon.
export const analyticsRouter = express.Router();
export const adminRouter = express.Router();

const visitLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: "Too many page views recorded from this address.",
});

const VISITOR_ID = /^[a-z0-9-]{8,64}$/i;

/**
 * POST /api/analytics/visit - { visitorId, path }
 * Called by the storefront on each page view. Stores no personal data.
 */
analyticsRouter.post("/visit", visitLimiter, (req, res) => {
  const { visitorId, path } = req.body || {};
  if (typeof visitorId !== "string" || !VISITOR_ID.test(visitorId)) {
    return res.status(400).json({ success: false, message: "visitorId must be 8-64 letters, digits or dashes." });
  }
  if (typeof path !== "string" || !path.startsWith("/") || path.length > 200) {
    return res.status(400).json({ success: false, message: "path must start with / and be at most 200 characters." });
  }
  // Drop query strings so searches and tokens never end up in the stats.
  recordVisit({ visitorId, path: path.split("?")[0].split("#")[0] || "/" });
  res.status(204).end();
});

/** GET /api/admin/analytics - visit totals, 30-day series and top pages. */
adminRouter.get("/analytics", requireAdmin, (req, res) => {
  res.json({ success: true, ...getVisitSummary() });
});

// Clerk accounts (Google sign-in), cached briefly so the page doesn't hit Clerk on every refresh.
let clerkCache = { at: 0, users: null, error: null };
const loadClerkUsers = async () => {
  const client = getClerkClient();
  if (!client) return { users: [], error: "Google sign-in (Clerk) is not configured on this server." };
  if (clerkCache.users && Date.now() - clerkCache.at < 60 * 1000) return clerkCache;

  try {
    const all = [];
    for (let offset = 0; offset < 2000; offset += 100) {
      const page = await client.users.getUserList({ limit: 100, offset, orderBy: "-created_at" });
      const rows = Array.isArray(page) ? page : page.data || [];
      all.push(...rows);
      if (rows.length < 100) break;
    }
    const users = all.map((u) => {
      const primary =
        u.emailAddresses?.find((e) => e.id === u.primaryEmailAddressId) || u.emailAddresses?.[0];
      const email = (primary?.emailAddress || "").toLowerCase();
      const isAdmin = u.publicMetadata?.role === "admin" || isEmailAdmin(email);
      return {
        id: u.id,
        name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "",
        email,
        role: isAdmin ? "admin" : "user",
        signInMethod: "Google (Clerk)",
        avatar: u.imageUrl || null,
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
        lastLoginAt: u.lastSignInAt ? new Date(u.lastSignInAt).toISOString() : null,
        lastActiveAt: u.lastActiveAt ? new Date(u.lastActiveAt).toISOString() : null,
      };
    });
    clerkCache = { at: Date.now(), users, error: null };
    return clerkCache;
  } catch (err) {
    console.warn("[Admin] Could not list Clerk users:", err.message);
    return { users: [], error: "Couldn't load Google sign-in accounts from Clerk right now." };
  }
};

/**
 * GET /api/admin/users
 * Every account (email/password and Google), with their orders, spend and enquiries.
 */
adminRouter.get("/users", requireAdmin, async (req, res) => {
  const local = usersStore.map((u) => ({
    id: u.id,
    name: u.name,
    email: (u.email || "").toLowerCase(),
    role: u.role === "admin" ? "admin" : "user",
    signInMethod: "Email & password",
    company: u.company || "",
    phone: u.phone || "",
    createdAt: u.createdAt || null,
    lastLoginAt: u.lastLoginAt || null,
  }));
  const clerk = await loadClerkUsers();

  const orders = getAllOrders();
  const enquiries = [...getAllEnquiries(), ...getAllQuotes()];
  const statsFor = (user) => {
    const mine = orders.filter(
      (o) => o.userId === user.id || (o.user?.email || o.customer?.email || o.userEmail || "").toLowerCase() === user.email
    );
    const leads = enquiries.filter(
      (e) => e.userId === user.id || (e.email || e.contactEmail || e.userEmail || "").toLowerCase() === user.email
    );
    const lastOrder = mine.map((o) => o.createdAt).filter(Boolean).sort().pop() || null;
    return {
      orders: mine.length,
      totalSpent: Number(mine.reduce((sum, o) => sum + Number(o.pricing?.total ?? o.total ?? 0), 0).toFixed(2)),
      enquiries: leads.length,
      lastOrderAt: lastOrder,
    };
  };

  const users = [...local, ...clerk.users]
    .map((u) => ({ ...u, ...statsFor(u) }))
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  res.json({
    success: true,
    total: users.length,
    newThisWeek: users.filter((u) => u.createdAt && u.createdAt >= weekAgo).length,
    admins: users.filter((u) => u.role === "admin").length,
    withOrders: users.filter((u) => u.orders > 0).length,
    clerkError: clerk.error,
    users,
  });
});
