import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { isMongoConnected } from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_FILE = path.join(__dirname, "users.json");

// Initial pre-configured seed users
export const INITIAL_USERS = [
  {
    id: "usr_admin_01",
    name: "Store Administrator",
    email: "admin@shop.co",
    passwordHash: bcrypt.hashSync("admin123", 10),
    role: "admin",
    createdAt: new Date().toISOString(),
  },
  {
    id: "usr_admin_02",
    name: "Store Administrator",
    email: "admin@giftingwellness.com",
    passwordHash: bcrypt.hashSync("admin123", 10),
    role: "admin",
    createdAt: new Date().toISOString(),
  },
  {
    id: "usr_user_01",
    name: "Alex Morgan",
    email: "user@shop.co",
    passwordHash: bcrypt.hashSync("user123", 10),
    role: "user",
    createdAt: new Date().toISOString(),
  },
  {
    id: "usr_user_02",
    name: "Corporate Client",
    email: "user@giftingwellness.com",
    passwordHash: bcrypt.hashSync("user123", 10),
    role: "user",
    createdAt: new Date().toISOString(),
  },
];

// In-memory users array for synchronous auth checks
export const usersStore = [...INITIAL_USERS];

/**
 * Loads registered users from disk and merges with initial users
 */
const loadUsersFromDisk = () => {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, "utf8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (const u of list) {
          if (u && u.email && !usersStore.some((existing) => existing.email.toLowerCase() === u.email.toLowerCase())) {
            usersStore.push(u);
          }
        }
      }
    }
  } catch (err) {
    console.warn("[UsersStore] Could not read users.json:", err.message);
  }
};

/**
 * Persists dynamic registered users atomically to disk
 */
const saveUsersToDisk = () => {
  try {
    const tmp = path.join(__dirname, `.users.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 6)}`);
    fs.writeFileSync(tmp, JSON.stringify(usersStore, null, 2), "utf8");
    fs.renameSync(tmp, USERS_FILE);
  } catch (err) {
    console.error("[UsersStore] Failed to persist users to disk:", err.message);
  }
};

/**
 * Sync user to MongoDB Atlas if connected
 */
const syncUserToMongo = async (user) => {
  if (!isMongoConnected() || !user) return;
  try {
    const { User } = await import("../models/User.js");
    await User.findOneAndUpdate(
      { email: user.email.toLowerCase() },
      { $set: user },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.warn("[UsersStore] MongoDB User sync notice:", err.message);
  }
};

export const findUserByEmail = (email) => {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  return usersStore.find((u) => u.email.toLowerCase() === normalized) || null;
};

export const findUserById = (id) => {
  return usersStore.find((u) => u.id === id) || null;
};

export const createUser = ({ name, email, password, role = "user", company = "", phone = "" }) => {
  const existing = findUserByEmail(email);
  if (existing) {
    throw new Error("A user with this email address already exists.");
  }

  const newUser = {
    id: `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10),
    role: role === "admin" ? "admin" : "user",
    company: company ? company.trim() : "",
    phone: phone ? phone.trim() : "",
    createdAt: new Date().toISOString(),
  };

  usersStore.push(newUser);
  saveUsersToDisk();

  syncUserToMongo(newUser).catch(() => {});

  return newUser;
};

export const updateUserProfile = (id, updates) => {
  const user = findUserById(id);
  if (!user) return null;

  if (updates.name) user.name = updates.name.trim();
  if (updates.company !== undefined) user.company = updates.company.trim();
  if (updates.phone !== undefined) user.phone = updates.phone.trim();
  user.updatedAt = new Date().toISOString();

  saveUsersToDisk();
  syncUserToMongo(user).catch(() => {});
  return user;
};

/** Stamp a successful sign-in so the admin Users page can show "last signed in". */
export const recordLogin = (id) => {
  const user = findUserById(id);
  if (!user) return;
  user.lastLoginAt = new Date().toISOString();
  saveUsersToDisk();
  syncUserToMongo(user).catch(() => {});
};

loadUsersFromDisk();
