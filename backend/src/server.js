import express from "express";
// Giftingwellness Dual-Port Unified Backend Server
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import productsRouter from "./routes/products.js";
import ordersRouter from "./routes/orders.js";
import couponsRouter from "./routes/coupons.js";
import authRouter from "./routes/auth.js";
import uploadRouter from "./routes/upload.js";
import siteContentRouter from "./routes/siteContent.js";
import { validateAuthConfig, authenticateToken, requireAdmin, optionalAuth } from "./middleware/auth.js";
import { quoteRequestLimiter, enquiryLimiter } from "./middleware/rateLimiter.js";
import { validateQuotePayload, validateEnquiryPayload } from "./middleware/validation.js";
import { connectDB, isMongoConnected } from "./db.js";
import { BulkEnquiry } from "./models/BulkEnquiry.js";
import {
  saveQuote,
  getAllQuotes,
  updateQuoteStatus,
  saveEnquiry,
  getAllEnquiries,
  getQuotesByUserIdOrEmail,
  getEnquiriesByUserIdOrEmail,
} from "./data/quotesStore.js";
import { sendQuoteNotificationEmail } from "./services/emailService.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../uploads");

// Ensure uploads folder exists on startup
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Fail fast on startup if security environment variables are missing or insecure
try {
  validateAuthConfig();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const USER_PORT = parseInt(process.env.USER_PORT || process.env.PORT || "5000", 10);
const ADMIN_PORT = parseInt(process.env.ADMIN_PORT || "5001", 10);

/**
 * Creates an Express app instance configured for either:
 * - User Storefront: Read-only for catalogue products (POST/PUT/DELETE/bulk-import blocked)
 * - Admin Management: Full CRUD, bulk import, and inventory editing (protected by auth)
 * Both apps share the exact same underlying catalogStore, orders, and coupons database.
 */
export const createApp = ({ isUserPort = false, port = USER_PORT, peerPort = ADMIN_PORT } = {}) => {
  const app = express();

  // Enable trust proxy for accurate client IP resolution behind reverse proxies
  app.set("trust proxy", 1);

  // Middleware with explicit payload size limit to prevent memory exhaustion
  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
    })
  );

  // Serve uploaded images statically on both User Port and Admin Port
  app.use("/uploads", express.static(uploadsDir));

  // Support up to 25MB for image uploads
  app.use("/api/upload", express.json({ limit: "25mb" }));
  // Support up to 10MB for product payloads (can include data URLs or large features)
  app.use("/api/products", express.json({ limit: "10mb" }));
  // Support up to 5MB for bulk import batches (max 500 items with rich descriptions)
  app.use("/api/products/bulk-import", express.json({ limit: "5mb" }));
  // Enforce strict 100KB limit for all other standard endpoints to prevent memory exhaustion
  app.use(express.json({ limit: "100kb" }));

  // Request logger with port role identifier
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      const roleLabel = isUserPort ? "USER-PORT" : "ADMIN-PORT";
      console.log(`[${roleLabel}:${port}] [${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: isUserPort
        ? "Giftingwellness Storefront API (View & Checkout)"
        : "Giftingwellness Admin Management API (Full CRUD & Import)",
      role: isUserPort ? "user" : "admin",
      port,
      peerPort,
      catalogueEditingAllowed: !isUserPort,
      sharedDatabase: "catalogStore & catalog.json",
      mongodb: isMongoConnected() ? "connected" : "disconnected",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Quote Request Endpoint (Corporate Gifting) - Protected by rate limiter and payload validation
  app.post("/api/quote", optionalAuth, quoteRequestLimiter, validateQuotePayload, async (req, res) => {
    try {
      const {
        productId,
        productTitle,
        sku,
        brand,
        selectedColor,
        quantity,
        brandingOption,
        companyName,
        contactName,
        contactEmail,
        contactPhone,
        pincode,
        customText,
        notes,
        estimatedTotal,
      } = req.body;

      const quoteId = `QUOTE-${Math.floor(100000 + Math.random() * 900000)}`;
      const newQuote = {
        quoteId,
        userId: req.user?.id || null,
        userEmail: req.user?.email || null,
        productId: productId || null,
        productTitle: typeof productTitle === "string" ? productTitle.slice(0, 200) : "Custom Inquiry",
        sku: sku || null,
        brand: brand || null,
        selectedColor: selectedColor || null,
        quantity: quantity || 100,
        brandingOption: brandingOption || "UV Digital Print",
        companyName: companyName ? companyName.trim() : "Corporate Client",
        contactName: contactName ? contactName.trim() : null,
        contactEmail: contactEmail.trim().toLowerCase(),
        contactPhone: contactPhone ? contactPhone.trim() : null,
        pincode: pincode ? pincode.trim() : null,
        customText: customText ? customText.trim() : null,
        notes: notes ? notes.slice(0, 1000) : "",
        estimatedTotal: estimatedTotal ? Number(estimatedTotal) : null,
        status: "pending_review",
        createdAt: new Date().toISOString(),
      };

      await saveQuote(newQuote);
      sendQuoteNotificationEmail(newQuote).catch((e) => console.warn("Quote email alert notice:", e.message));

      res.status(201).json({
        success: true,
        message: "Bulk quotation inquiry received! Our sales representative will contact you within 2 hours.",
        quote: newQuote,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to record quote request." });
    }
  });

  // Customer GET /api/quote/my-quotes - List quotes for currently logged-in account
  app.get("/api/quote/my-quotes", authenticateToken, (req, res) => {
    const quotes = getQuotesByUserIdOrEmail(req.user.id, req.user.email);
    res.json({ success: true, count: quotes.length, quotes });
  });

  // Admin GET /api/quote - List all bulk corporate quotes
  app.get("/api/quote", authenticateToken, (req, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Administrative access required." });
    }
    const quotes = getAllQuotes();
    res.json({ success: true, count: quotes.length, quotes });
  });

  // Admin PATCH /api/quote/:quoteId/status - Update quote status & admin notes
  app.patch("/api/quote/:quoteId/status", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Administrative access required." });
    }
    const { status, adminNotes } = req.body;
    const updated = await updateQuoteStatus(req.params.quoteId, { status, adminNotes });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Quote not found." });
    }
    res.json({ success: true, message: "Quote status updated successfully", quote: updated });
  });

  // Bulk Enquiry Endpoint (Corporate Gifting Lookbooks & Quotes)
  app.post("/api/enquiries", optionalAuth, enquiryLimiter, validateEnquiryPayload, async (req, res) => {
    try {
      const { name, email, phone, company, category, quantity, customBranding, targetDate, notes } = req.body;
      const enquiryId = `ENQ-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

      const newEnquiry = {
        enquiryId,
        userId: req.user?.id || null,
        userEmail: req.user?.email || null,
        name: name ? String(name).trim() : "Corporate Client",
        email: email ? String(email).trim().toLowerCase() : "",
        phone: phone ? String(phone).trim() : "",
        company: company ? String(company).trim() : "",
        category: category ? String(category).trim() : "General Gifting",
        quantity: quantity ? String(quantity).trim() : "100 units",
        customBranding: customBranding ? String(customBranding).trim() : "Yes",
        targetDate: targetDate ? String(targetDate).trim() : "",
        notes: notes ? String(notes).trim().slice(0, 1000) : "",
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      await saveEnquiry(newEnquiry);

      res.status(201).json({
        success: true,
        message: "Enquiry submitted successfully! Our representative will contact you within 2 working hours.",
        enquiryId,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to submit enquiry." });
    }
  });

  // Customer GET /api/enquiries/my-enquiries - List enquiries for currently logged-in account
  app.get("/api/enquiries/my-enquiries", authenticateToken, (req, res) => {
    const enquiries = getEnquiriesByUserIdOrEmail(req.user.id, req.user.email);
    res.json({ success: true, count: enquiries.length, enquiries });
  });

  // Admin GET /api/enquiries - List all corporate enquiries
  app.get("/api/enquiries", authenticateToken, (req, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Administrative access required." });
    }
    const enquiries = getAllEnquiries();
    res.json({ success: true, count: enquiries.length, enquiries });
  });

  // Mount auth router
  app.use("/api/auth", authRouter);

  // USER PORT RESTRICTION: Strictly block product catalogue mutations and uploads on User Port
  if (isUserPort) {
    app.use("/api/upload", (req, res) => {
      return res.status(403).json({
        success: false,
        error: "FORBIDDEN_PORT_MUTATION",
        message: `Image uploads are disabled on the User Storefront port (${port}). Please perform uploads on the Admin Management port (${peerPort}).`,
        userPort: port,
        adminPort: peerPort,
      });
    });

    app.use("/api/products", (req, res, next) => {
      const isMutationMethod = ["POST", "PUT", "DELETE", "PATCH"].includes(req.method);
      const isImportPath = req.originalUrl && req.originalUrl.includes("/bulk-import");

      if (isMutationMethod || isImportPath) {
        return res.status(403).json({
          success: false,
          error: "FORBIDDEN_PORT_MUTATION",
          message: `Catalogue modification and product mutations are disabled on the User Storefront port (${port}). Please perform editing on the Admin Management port (${peerPort}).`,
          userPort: port,
          adminPort: peerPort,
        });
      }
      next();
    });

    app.use("/api/site-content", (req, res, next) => {
      const isMutationMethod = ["POST", "PUT", "DELETE", "PATCH"].includes(req.method);
      if (isMutationMethod) {
        return res.status(403).json({
          success: false,
          error: "FORBIDDEN_PORT_MUTATION",
          message: `Site content modification is disabled on the User Storefront port (${port}). Please perform editing on the Admin Management port (${peerPort}).`,
          userPort: port,
          adminPort: peerPort,
        });
      }
      next();
    });
  }

  // Mount shared modular routes (Both apps share the SAME in-memory catalogStore and catalog.json file!)
  app.use("/api/upload", uploadRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/coupons", couponsRouter);
  app.use("/api/site-content", siteContentRouter);

  // 404 handler for unknown API routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({ success: false, message: "API endpoint not found" });
  });

  // Centralized error handling middleware (prevents leaking internal stack traces)
  app.use((err, req, res, next) => {
    if (err.type === "entity.too.large") {
      const isBulk = req.originalUrl && req.originalUrl.includes("/api/products/bulk-import");
      const isUpload = req.originalUrl && req.originalUrl.includes("/api/upload");
      return res.status(413).json({
        success: false,
        message: isUpload
          ? "Request payload too large. Maximum allowed size for image upload is 25MB."
          : isBulk
          ? "Request payload too large. Maximum allowed size for bulk import is 5MB."
          : "Request payload too large. Maximum allowed size is 100KB.",
      });
    }
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
      return res.status(400).json({
        success: false,
        message: "Malformed JSON payload in request body.",
      });
    }
    console.error("Unhandled error:", err.message);
    res.status(500).json({
      success: false,
      message: "An internal server error occurred.",
    });
  });

  return app;
};

// Instantiate the two specialized Express apps
export const userApp = createApp({ isUserPort: true, port: USER_PORT, peerPort: ADMIN_PORT });
export const adminApp = createApp({ isUserPort: false, port: ADMIN_PORT, peerPort: USER_PORT });

// Start both dual-port servers in development, or unified single-port in production
export const startServers = () => {
  // Connect to MongoDB Atlas
  connectDB().catch((err) => {
    console.warn("MongoDB Atlas connection notice:", err.message);
  });

  const servers = {};
  const isProduction = process.env.NODE_ENV === "production" || process.env.SINGLE_PORT === "true";
  const PORT = parseInt(process.env.PORT || "5000", 10);

  // =========================================================================
  // PRODUCTION UNIFIED SINGLE-PORT MODE (Cloud Deployments: Render, Railway, AWS, Heroku)
  // =========================================================================
  if (isProduction) {
    // Optionally serve compiled frontend SPA if dist/ exists
    const frontendDist = path.resolve(__dirname, "../../frontend/dist");
    if (fs.existsSync(frontendDist)) {
      adminApp.use(express.static(frontendDist));
      adminApp.get("*", (req, res, next) => {
        if (req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/uploads")) {
          return next();
        }
        res.sendFile(path.join(frontendDist, "index.html"));
      });
    }

    const prodServer = adminApp.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 GIFTINGWELLNESS UNIFIED PRODUCTION SERVER READY`);
      console.log(`   ➜ Listening on Port:  ${PORT}`);
      console.log(`   ➜ Mode:               Production (Single-Port Cloud Architecture)`);
      console.log(`   ➜ Database:           MongoDB Atlas (${isMongoConnected() ? "Connected" : "Syncing..."})`);
      console.log(`   ➜ Health Check:       /api/health`);
      console.log(`====================================================`);
    });

    prodServer.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.warn(`⚠️ Production port ${PORT} is in use.`);
      } else {
        console.error("Production server error:", err);
      }
    });

    servers.server = prodServer;
    servers.adminServer = prodServer;
    servers.userServer = prodServer;
    return servers;
  }

  // =========================================================================
  // LOCAL DEVELOPMENT DUAL-PORT MODE (Preserves backward compatibility for test suite)
  // =========================================================================
  // 1. User Storefront API Listener (Port 5000)
  const userServer = userApp.listen(USER_PORT, () => {
    console.log(`🚀 Giftingwellness Storefront API running on http://localhost:${USER_PORT}`);
    console.log(`   Role: Customer View & Checkout (Mutations blocked)`);
    console.log(`   Health check: http://localhost:${USER_PORT}/api/health`);
  });

  userServer.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`⚠️ User port ${USER_PORT} is in use (e.g. background server running).`);
    } else {
      console.error("User server error:", err);
    }
  });
  servers.userServer = userServer;

  // 2. Admin Management API Listener (Port 5001)
  const adminServer = adminApp.listen(ADMIN_PORT, () => {
    console.log(`🛡️ Giftingwellness Admin Management API running on http://localhost:${ADMIN_PORT}`);
    console.log(`   Role: Admin Management (Full Edit & Bulk Import enabled)`);
    console.log(`   Health check: http://localhost:${ADMIN_PORT}/api/health`);
    console.log(`📦 Shared Database: Single synchronized catalogStore & catalog.json`);
  });

  adminServer.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`⚠️ Admin port ${ADMIN_PORT} is in use (e.g. background server running).`);
    } else {
      console.error("Admin server error:", err);
    }
  });
  servers.adminServer = adminServer;

  return servers;
};

// Start servers on direct startup (prevent starting background listeners during automated test runs)
const isTestRunner = process.env.NODE_ENV === "test" || process.argv.some((arg) => arg.includes("test"));
if (!isTestRunner) {
  startServers();
}

// Default export is adminApp for complete backwards compatibility with tests and app.listen(0)
export default adminApp;

