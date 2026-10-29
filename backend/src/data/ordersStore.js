import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { isMongoConnected } from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ORDERS_FILE = path.join(__dirname, "orders.json");

// In-memory orders map for high-throughput reads
const ordersMap = new Map();

/**
 * Loads orders from durable disk storage on startup
 */
export const loadOrdersFromDisk = () => {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const raw = fs.readFileSync(ORDERS_FILE, "utf8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        ordersMap.clear();
        for (const ord of list) {
          if (ord && ord.orderId) {
            ordersMap.set(ord.orderId, ord);
          }
        }
        return list;
      }
    }
  } catch (err) {
    console.warn("[OrdersStore] Could not read orders.json:", err.message);
  }
  return Array.from(ordersMap.values());
};

/**
 * Persists orders atomically to disk
 */
export const saveOrdersToDisk = () => {
  try {
    const list = Array.from(ordersMap.values());
    const tmp = path.join(__dirname, `.orders.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 6)}`);
    fs.writeFileSync(tmp, JSON.stringify(list, null, 2), "utf8");
    fs.renameSync(tmp, ORDERS_FILE);
  } catch (err) {
    console.error("[OrdersStore] Failed to persist orders to disk:", err.message);
  }
};

/**
 * Syncs a single order doc into MongoDB Atlas asynchronously
 */
export const syncOrderDocToMongo = async (order) => {
  if (!isMongoConnected() || !order) return;
  try {
    const { Order } = await import("../models/Order.js");
    await Order.findOneAndUpdate(
      { orderId: order.orderId },
      { $set: order },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.warn(`[OrdersStore] MongoDB Order sync warning for ${order.orderId}:`, err.message);
  }
};

/**
 * Save or update an order in memory, on disk, and in MongoDB
 */
export const saveOrder = async (order) => {
  if (!order || !order.orderId) return null;
  ordersMap.set(order.orderId, order);
  saveOrdersToDisk();

  // Async sync to MongoDB Atlas if connected
  syncOrderDocToMongo(order).catch(() => {});
  return order;
};

/**
 * Get all orders (for admin)
 */
export const getAllOrders = () => {
  return Array.from(ordersMap.values()).sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
};

/**
 * Get order by ID
 */
export const getOrderById = (orderId) => {
  return ordersMap.get(orderId) || null;
};

/**
 * Get orders for a specific user ID
 */
export const getOrdersByUserId = (userId) => {
  return getAllOrders().filter((o) => o.userId === userId);
};

/**
 * Update order status, tracking details, and admin notes
 */
export const updateOrderStatus = async (orderId, { status, tracking, adminNotes, quoteAmount }) => {
  const existing = ordersMap.get(orderId);
  if (!existing) return null;

  const updated = {
    ...existing,
    ...(status ? { status } : {}),
    ...(adminNotes !== undefined ? { adminNotes } : {}),
    ...(quoteAmount !== undefined ? { quoteAmount: Number(quoteAmount) } : {}),
    tracking: {
      ...(existing.tracking || {}),
      ...(tracking || {}),
    },
    updatedAt: new Date().toISOString(),
  };

  ordersMap.set(orderId, updated);
  saveOrdersToDisk();
  syncOrderDocToMongo(updated).catch(() => {});
  return updated;
};

// Initialize store from disk on module load
loadOrdersFromDisk();
