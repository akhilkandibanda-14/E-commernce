import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { findUserByEmail, createUser, recordLogin } from "../data/users.js";
import { authenticateToken, getJwtSecret, JWT_ALGORITHM } from "../middleware/auth.js";
import { authLoginLimiter, authRegisterLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Helper to generate secure JWT token with explicit algorithm
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    getJwtSecret(),
    {
      algorithm: JWT_ALGORITHM,
      expiresIn: "7d",
    }
  );
};

// POST /api/auth/login - Rate limited to 10 requests per 15 minutes per IP
router.post("/login", authLoginLimiter, (req, res) => {
  try {
    const { email, password, roleHint } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const trimmedEmail = typeof email === "string" ? email.trim() : "";
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    const user = findUserByEmail(trimmedEmail);
    const isMatch = user ? bcrypt.compareSync(password, user.passwordHash) : false;

    // Uniform response avoids leaking whether the account exists
    if (!user || !isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Check if user is logging in via admin tab specifically
    if (roleHint === "admin" && user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "This account does not have administrator privileges. Please use the Customer login.",
      });
    }

    recordLogin(user.id);
    const token = generateToken(user);

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/register - Rate limited to 5 registrations per 1 hour per IP
router.post("/register", authRegisterLimiter, (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    const trimmedName = typeof name === "string" ? name.trim() : "";
    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters long.",
      });
    }

    const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    // PRIVILEGE ESCALATION PREVENTION:
    // Public registration ALWAYS assigns the 'user' role.
    // Client-submitted role values (e.g. role: 'admin') are strictly ignored.
    const assignedRole = "user";

    const newUser = createUser({
      name: trimmedName,
      email: trimmedEmail,
      password,
      role: assignedRole,
    });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: "Account created successfully!",
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/auth/me (Verify session & retrieve authoritative profile)
router.get("/me", authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// GET /api/auth/demo-accounts (Returns pre-configured demo logins in dev mode only)
router.get("/demo-accounts", (req, res) => {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEMO_ACCOUNTS !== "true") {
    return res.status(404).json({
      success: false,
      message: "Demo accounts are disabled in production mode.",
    });
  }

  res.json({
    success: true,
    isDevelopmentMode: process.env.NODE_ENV !== "production",
    accounts: {
      admin: {
        email: "admin@shop.co",
        password: "admin123",
        role: "admin",
        label: "Store Administrator (Demo)",
      },
      user: {
        email: "user@shop.co",
        password: "user123",
        role: "user",
        label: "Regular Customer (Demo)",
      },
    },
  });
});

// GET /api/auth/users - List users (Admin only)
router.get("/users", authenticateToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Administrative access required." });
  }
  const users = (usersStore || []).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    company: u.company || "",
    phone: u.phone || "",
    createdAt: u.createdAt,
  }));
  res.json({ success: true, count: users.length, users });
});

export default router;
