import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { findCatalogProductById, normalizeSize } from "./products.js";
import { VALID_COUPONS } from "./coupons.js";
import { orderCreationLimiter } from "../middleware/rateLimiter.js";
import {
  saveOrder as persistOrder,
  updateOrderStatus as persistOrderStatus,
  getAllOrders as fetchAllPersistedOrders,
} from "../data/ordersStore.js";
import {
  sendOrderConfirmationEmail,
  sendDispatchUpdateEmail,
} from "../services/emailService.js";

const router = express.Router();

// Authoritative orders store initialized from durable storage
export const ordersStore = new Map();
for (const ord of fetchAllPersistedOrders()) {
  if (ord && ord.orderId) ordersStore.set(ord.orderId, ord);
}

// In-memory idempotency store to prevent duplicate orders
// Key: `${userId}:${idempotencyKey}` -> { status: "processing" | "completed", response, orderId, createdAt }
export const idempotencyStore = new Map();

// POST /api/orders - Create new order (Requires Authentication + Rate Limited)
router.post("/", authenticateToken, orderCreationLimiter, (req, res) => {
  let storeKey = null;

  try {
    const rawKey = req.headers["idempotency-key"] || req.body?.idempotencyKey;
    const idempotencyKey = rawKey ? String(rawKey).trim() : null;

    if (idempotencyKey) {
      storeKey = `${req.user.id}:${idempotencyKey}`;
      const existing = idempotencyStore.get(storeKey);

      if (existing) {
        if (existing.status === "completed") {
          // Idempotent replay: Return cached order confirmation without creating a new order
          return res.status(200).json({
            ...existing.response,
            isIdempotentReplay: true,
          });
        }
        if (existing.status === "processing") {
          return res.status(409).json({
            success: false,
            message: "Order is currently being processed with this idempotency key. Please wait.",
          });
        }
      }

      // Mark as in-flight
      idempotencyStore.set(storeKey, {
        status: "processing",
        createdAt: Date.now(),
      });
    }

    const abortIdempotency = () => {
      if (storeKey) {
        idempotencyStore.delete(storeKey);
      }
    };

    const { customer, items, paymentMethod, promoCode, gifting } = req.body;

    // 1. Validate customer shipping details
    if (!customer || typeof customer !== "object") {
      abortIdempotency();
      return res.status(400).json({
        success: false,
        message: "Customer shipping information is required.",
      });
    }

    const fullName = typeof customer.fullName === "string" ? customer.fullName.trim() : "";
    const address = typeof customer.address === "string" ? customer.address.trim() : "";
    const city = typeof customer.city === "string" ? customer.city.trim() : "";
    const postalCode = typeof customer.postalCode === "string" ? customer.postalCode.trim() : "";
    const phone = typeof customer.phone === "string" ? customer.phone.trim() : "";
    const company = typeof customer.company === "string" ? customer.company.trim() : "";
    const gstin = typeof customer.gstin === "string" ? customer.gstin.trim() : "";

    if (!fullName || !address || !city || !postalCode) {
      abortIdempotency();
      return res.status(400).json({
        success: false,
        message: "All shipping fields (full name, address, city, and postal code) are required.",
      });
    }

    if (fullName.length > 100 || address.length > 250 || city.length > 100 || postalCode.length > 20) {
      abortIdempotency();
      return res.status(400).json({
        success: false,
        message: "One or more shipping fields exceed maximum allowed character limits.",
      });
    }

    // 2. Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      abortIdempotency();
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item.",
      });
    }

    if (items.length > 50) {
      abortIdempotency();
      return res.status(400).json({
        success: false,
        message: "Order cannot contain more than 50 distinct items.",
      });
    }

    // 3. Validate every item against live backend catalog & derive authoritative prices
    const verifiedItems = [];

    for (const it of items) {
      if (!it || it.id === undefined || it.id === null) {
        abortIdempotency();
        return res.status(400).json({
          success: false,
          message: "Each order item must specify a valid product ID.",
        });
      }

      const product = findCatalogProductById(it.id);
      if (!product) {
        abortIdempotency();
        return res.status(404).json({
          success: false,
          message: `Product #${it.id} was not found in the catalog or is no longer available.`,
        });
      }

      const qty = Number(it.quantity);
      if (!Number.isInteger(qty) || qty <= 0 || qty > 100) {
        abortIdempotency();
        return res.status(400).json({
          success: false,
          message: `Invalid quantity "${it.quantity}" for product "${product.title}". Quantity must be a whole number between 1 and 100.`,
        });
      }

      // Authoritative unit price derived strictly from backend catalog
      const unitPrice = Number(product.price);
      const chosenSize = it.size ? normalizeSize(it.size) : (product.sizes?.[0] || "M");
      const lineTotal = Number((unitPrice * qty).toFixed(2));

      verifiedItems.push({
        id: product.id,
        title: product.title,
        price: unitPrice,
        quantity: qty,
        size: chosenSize,
        selectedColor: it.selectedColor || (product.colors?.[0] || null),
        image: product.img || (product.images && product.images[0]) || null,
        category: product.category || "general",
        lineTotal,
      });
    }

    // 4. Server-authoritative calculation of subtotal, discounts, delivery fee, and total
    const subtotal = Number(
      verifiedItems.reduce((acc, it) => acc + it.price * it.quantity, 0).toFixed(2)
    );

    let discountPercent = 0;
    let freeShipping = false;
    let validatedPromoCode = null;

    if (promoCode) {
      const normalizedCode = String(promoCode).trim().toUpperCase();
      const coupon = VALID_COUPONS[normalizedCode];

      if (!coupon) {
        abortIdempotency();
        return res.status(400).json({
          success: false,
          message: `Invalid coupon code: "${promoCode}".`,
        });
      }

      discountPercent = coupon.discountPercent || 0;
      freeShipping = Boolean(coupon.freeShipping);
      validatedPromoCode = normalizedCode;
    }

    const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
    const deliveryFee = freeShipping || subtotal === 0 ? 0 : 15;
    const total = Number(Math.max(0, subtotal - discountAmount + deliveryFee).toFixed(2));

    // 5. Build authoritative order enquiry record
    const orderId = `SHOP-ENQ-${Math.floor(100000 + Math.random() * 900000)}`;
    const createdAt = new Date().toISOString();
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 4);
    const totalQuantity = verifiedItems.reduce((acc, it) => acc + (it.quantity || 1), 0);
    const customerNotes = typeof req.body.notes === "string" ? req.body.notes.trim() : (typeof customer.notes === "string" ? customer.notes.trim() : "");

    const newOrder = {
      orderId,
      orderType: "order_enquiry",
      totalQuantity,
      notes: customerNotes,
      userId: req.user.id,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
      },
      status: "pending",
      createdAt,
      estimatedDelivery: deliveryDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      customer: {
        fullName,
        email: (customer.email || req.user.email).trim(),
        phone: phone || "",
        company: company || "",
        address,
        city,
        postalCode,
        gstin: gstin || "",
        notes: customerNotes,
      },
      gifting: {
        isGift: Boolean(gifting?.isGift),
        senderName: gifting?.senderName ? String(gifting.senderName).trim().slice(0, 100) : "",
        recipientName: gifting?.recipientName ? String(gifting.recipientName).trim().slice(0, 100) : "",
        giftMessage: gifting?.giftMessage ? String(gifting.giftMessage).trim().slice(0, 500) : "",
        giftWrap: Boolean(gifting?.giftWrap),
        giftWrapType: gifting?.giftWrapType ? String(gifting.giftWrapType).trim().slice(0, 50) : "Standard",
        hidePricingOnSlip: Boolean(gifting?.hidePricingOnSlip),
      },
      items: verifiedItems,
      pricing: {
        subtotal,
        discount: discountAmount,
        discountPercent,
        deliveryFee,
        total,
        promoCode: validatedPromoCode,
      },
      paymentMethod: paymentMethod || "order_enquiry (no online payment)",
      paymentStatus: "pending",
    };

    // 6. Record order in memory and durable persistence store (disk & MongoDB)
    ordersStore.set(orderId, newOrder);
    persistOrder(newOrder).catch((e) => console.warn("Order persist notice:", e.message));
    sendOrderConfirmationEmail(newOrder).catch((e) => console.warn("Order email notice:", e.message));

    const responsePayload = {
      success: true,
      message: "Order enquiry submitted successfully! Our sales team will email your quote shortly.",
      order: newOrder,
    };

    // 7. Complete idempotency record
    if (storeKey) {
      idempotencyStore.set(storeKey, {
        status: "completed",
        response: responsePayload,
        orderId,
        createdAt: Date.now(),
      });
    }

    res.status(201).json(responsePayload);
  } catch (error) {
    if (storeKey) {
      idempotencyStore.delete(storeKey);
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/orders/enquiry - Public / Guest Order Enquiry (No Login Required)
router.post("/enquiry", orderCreationLimiter, (req, res) => {
  try {
    const { customer, items, notes, gifting } = req.body;

    if (!customer || typeof customer !== "object") {
      return res.status(400).json({
        success: false,
        message: "Customer contact details are required.",
      });
    }

    const fullName = typeof customer.fullName === "string" ? customer.fullName.trim() : "";
    const email = typeof customer.email === "string" ? customer.email.trim() : "";
    const phone = typeof customer.phone === "string" ? customer.phone.trim() : "";
    const address = typeof customer.address === "string" ? customer.address.trim() : "";
    const city = typeof customer.city === "string" ? customer.city.trim() : "";
    const postalCode = typeof customer.postalCode === "string" ? customer.postalCode.trim() : "";
    const company = typeof customer.company === "string" ? customer.company.trim() : "";
    const gstin = typeof customer.gstin === "string" ? customer.gstin.trim() : "";
    const customerNotes = typeof notes === "string" ? notes.trim() : (typeof customer.notes === "string" ? customer.notes.trim() : "");

    if (!fullName || !email) {
      return res.status(400).json({
        success: false,
        message: "Your full name and email address are required to submit an order enquiry.",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order enquiry must contain at least one item.",
      });
    }

    const verifiedItems = [];
    for (const it of items) {
      if (!it || it.id === undefined || it.id === null) {
        return res.status(400).json({
          success: false,
          message: "Each enquiry item must specify a valid product ID.",
        });
      }

      const product = findCatalogProductById(it.id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product #${it.id} was not found in the catalog or is no longer available.`,
        });
      }

      const qty = Number(it.quantity);
      if (!Number.isInteger(qty) || qty <= 0 || qty > 10000) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity "${it.quantity}" for product "${product.title}". Quantity must be a positive integer.`,
        });
      }

      const unitPrice = Number(product.price);
      const chosenSize = it.size ? normalizeSize(it.size) : (product.sizes?.[0] || "Standard");
      const lineTotal = Number((unitPrice * qty).toFixed(2));

      verifiedItems.push({
        id: product.id,
        title: product.title,
        price: unitPrice,
        quantity: qty,
        size: chosenSize,
        selectedColor: it.selectedColor || (product.colors?.[0] || null),
        selectedBranding: it.selectedBranding || null,
        customLogoText: it.customLogoText || null,
        image: product.img || (product.images && product.images[0]) || null,
        category: product.category || "general",
        lineTotal,
      });
    }

    const subtotal = Number(
      verifiedItems.reduce((acc, it) => acc + it.price * it.quantity, 0).toFixed(2)
    );
    const totalQuantity = verifiedItems.reduce((acc, it) => acc + it.quantity, 0);

    const orderId = `SHOP-ENQ-${Math.floor(100000 + Math.random() * 900000)}`;
    const createdAt = new Date().toISOString();
    const guestUserId = `guest_${Date.now()}`;

    const newOrder = {
      orderId,
      orderType: "order_enquiry",
      totalQuantity,
      notes: customerNotes,
      userId: guestUserId,
      user: {
        id: guestUserId,
        name: fullName,
        email,
      },
      status: "pending",
      createdAt,
      estimatedDelivery: "Pending Quote Confirmation",
      customer: {
        fullName,
        email,
        phone: phone || "",
        company: company || "",
        address: address || "To be provided",
        city: city || "To be provided",
        postalCode: postalCode || "",
        gstin: gstin || "",
        notes: customerNotes,
      },
      gifting: {
        isGift: Boolean(gifting?.isGift),
        senderName: gifting?.senderName ? String(gifting.senderName).trim().slice(0, 100) : "",
        recipientName: gifting?.recipientName ? String(gifting.recipientName).trim().slice(0, 100) : "",
        giftMessage: gifting?.giftMessage ? String(gifting.giftMessage).trim().slice(0, 500) : "",
        giftWrap: Boolean(gifting?.giftWrap),
        hidePricingOnSlip: Boolean(gifting?.hidePricingOnSlip),
      },
      items: verifiedItems,
      pricing: {
        subtotal,
        discount: 0,
        discountPercent: 0,
        deliveryFee: 0,
        total: subtotal,
      },
      paymentMethod: "order_enquiry (no online payment)",
      paymentStatus: "pending",
    };

    ordersStore.set(orderId, newOrder);
    persistOrder(newOrder).catch((e) => console.warn("Order persist notice:", e.message));
    sendOrderConfirmationEmail(newOrder).catch((e) => console.warn("Order email notice:", e.message));

    res.status(201).json({
      success: true,
      message: "Order enquiry submitted successfully! Our sales team will email your quote shortly.",
      order: newOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders - List orders (Authenticated: Customer sees own, Admin sees all)
router.get("/", authenticateToken, (req, res) => {
  try {
    const all = Array.from(ordersStore.values());
    let results = [];

    if (req.user.role === "admin") {
      results = all;
    } else {
      results = all.filter((o) => {
        const matchesId = o.userId === req.user.id;
        const matchesUserEmail =
          req.user.email &&
          ((o.user?.email && o.user.email.toLowerCase() === req.user.email.toLowerCase()) ||
           (o.customer?.email && o.customer.email.toLowerCase() === req.user.email.toLowerCase()));
        return matchesId || matchesUserEmail;
      });
    }

    // Sort newest first
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      count: results.length,
      orders: results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/:orderId - Fetch order by ID (Enforces ownership boundary)
router.get("/:orderId", authenticateToken, (req, res) => {
  try {
    const { orderId } = req.params;
    const order = ordersStore.get(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    // Enforce ownership: Non-admin users can only view their own orders (by ID or account email)
    const isOwner =
      order.userId === req.user.id ||
      (req.user.email &&
        ((order.user?.email && order.user.email.toLowerCase() === req.user.email.toLowerCase()) ||
         (order.customer?.email && order.customer.email.toLowerCase() === req.user.email.toLowerCase())));

    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You do not have permission to view this order.",
      });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/orders/:orderId/status - Update order fulfillment & tracking (Admin only)
router.patch("/:orderId/status", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Administrative privileges are required to update order fulfillment status.",
      });
    }

    const { orderId } = req.params;
    const { status, tracking, adminNotes, quoteAmount } = req.body;

    const order = ordersStore.get(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: `Order #${orderId} was not found.` });
    }

    const validStatuses = ["pending", "quote_sent", "confirmed", "in_production", "dispatched", "delivered", "cancelled"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status "${status}". Allowed values: ${validStatuses.join(", ")}`,
      });
    }

    const updated = await persistOrderStatus(orderId, { status, tracking, adminNotes, quoteAmount });
    if (updated) {
      ordersStore.set(orderId, updated);
      if (status === "dispatched" && tracking?.trackingNumber) {
        sendDispatchUpdateEmail(updated, tracking).catch((e) => console.warn("Dispatch email notice:", e.message));
      }
    }

    res.json({
      success: true,
      message: `Order #${orderId} status successfully updated to "${status || order.status}".`,
      order: updated || order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
