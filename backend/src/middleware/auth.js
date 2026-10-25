import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { findUserById } from "../data/users.js";

dotenv.config();

// Enforces secure JWT Secret retrieval with zero insecure fallbacks
export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || typeof secret !== "string" || secret.trim().length === 0) {
    throw new Error(
      "FATAL: Missing JWT_SECRET environment variable. Backend cannot start securely without a configured JWT secret."
    );
  }
  if (secret.trim().length < 32) {
    throw new Error(
      "FATAL: JWT_SECRET must be at least 32 characters long for cryptographic security."
    );
  }
  return secret.trim();
};

// Fail-fast configuration validation at backend startup
export const validateAuthConfig = () => {
  return getJwtSecret();
};

// Backwards-compatible export that dynamically queries the configured secret
export const JWT_SECRET = process.env.JWT_SECRET ? process.env.JWT_SECRET.trim() : "";

// Supported signing and verification algorithm for internal JWTs
export const JWT_ALGORITHM = "HS256";

// Known administrator email addresses with permanent admin access
export const ADMIN_EMAILS = [
  "admin@giftingwellness.com",
  "admin@shop.co",
  "22273cm046@gmail.com",
  ...(process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase())
    : []),
];

export const isEmailAdmin = (email) => {
  if (!email || typeof email !== "string") return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
};

// Clerk secret retrieval helper
export const getClerkSecretKey = () => {
  const key = process.env.CLERK_SECRET_KEY;
  if (!key || typeof key !== "string" || !key.startsWith("sk_") || key.includes("your_")) {
    return null;
  }
  return key.trim();
};

let cachedClerkClient = null;
export const getClerkClient = () => {
  const secretKey = getClerkSecretKey();
  if (!secretKey) return null;
  if (!cachedClerkClient) {
    cachedClerkClient = createClerkClient({ secretKey });
  }
  return cachedClerkClient;
};

// In-memory cache for Clerk user profiles (5-minute TTL) to minimize latency & rate-limits
const clerkUserCache = new Map();

/**
 * Resolves a Clerk session token and returns a standardized user profile
 */
const verifyClerkToken = async (token) => {
  const secretKey = getClerkSecretKey();
  if (!secretKey) {
    throw new Error("Clerk authentication is not configured on this server (missing or default CLERK_SECRET_KEY).");
  }

  const verified = await verifyToken(token, { secretKey });
  if (!verified || !verified.sub) {
    throw new Error("Malformed Clerk session token claims.");
  }

  const clerkId = verified.sub;
  const now = Date.now();

  if (clerkUserCache.has(clerkId) && clerkUserCache.get(clerkId).expiresAt > now) {
    return clerkUserCache.get(clerkId).user;
  }

  let userProfile = null;
  const client = getClerkClient();

  if (client) {
    try {
      const userRecord = await client.users.getUser(clerkId);
      const primaryEmail =
        userRecord.emailAddresses?.find((e) => e.id === userRecord.primaryEmailAddressId)?.emailAddress ||
        userRecord.emailAddresses?.[0]?.emailAddress ||
        "";

      const isAdmin =
        userRecord.publicMetadata?.role === "admin" || isEmailAdmin(primaryEmail);

      userProfile = {
        id: userRecord.id,
        name:
          `${userRecord.firstName || ""} ${userRecord.lastName || ""}`.trim() ||
          userRecord.username ||
          primaryEmail.split("@")[0] ||
          "Customer",
        email: primaryEmail,
        avatar: userRecord.imageUrl || null,
        role: isAdmin ? "admin" : "customer",
        isClerk: true,
      };

      clerkUserCache.set(clerkId, { user: userProfile, expiresAt: now + 5 * 60 * 1000 });
      return userProfile;
    } catch (apiErr) {
      // If Clerk API fails (network or rate limit), fallback to decoded claims in verified token
    }
  }

  const fallbackEmail = verified.email || `${verified.sub}@clerk.user`;
  const isFallbackAdmin =
    verified.role === "admin" ||
    verified.metadata?.role === "admin" ||
    isEmailAdmin(fallbackEmail);

  userProfile = {
    id: verified.sub,
    name: verified.name || verified.first_name || "Customer",
    email: fallbackEmail,
    avatar: verified.picture || null,
    role: isFallbackAdmin ? "admin" : "customer",
    isClerk: true,
  };

  clerkUserCache.set(clerkId, { user: userProfile, expiresAt: now + 60 * 1000 });
  return userProfile;
};

/**
 * Dual Token Verification Middleware:
 * Supports Clerk RS256 JWTs alongside internal HS256 JWTs
 */
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token missing. Please log in.",
    });
  }

  // Inspect token header and payload to detect Clerk session tokens
  let decodedMeta = null;
  try {
    decodedMeta = jwt.decode(token, { complete: true });
  } catch {
    // Malformed token format
    return res.status(401).json({
      success: false,
      message: "Invalid or malformed authentication token. Please log in again.",
    });
  }

  const isClerkToken =
    decodedMeta?.header?.alg === "RS256" ||
    (typeof decodedMeta?.payload?.iss === "string" && decodedMeta.payload.iss.includes("clerk"));

  if (isClerkToken) {
    try {
      const user = await verifyClerkToken(token);
      req.user = user;
      return next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: err.message || "Invalid Clerk authentication session. Please sign in again.",
      });
    }
  }

  // Internal HS256 Token Verification (Seed accounts, test runner, and fallback login)
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, {
      algorithms: [JWT_ALGORITHM],
    });

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Malformed token claims. Please log in again.",
      });
    }

    const user = findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User session invalid or expired. Please log in again.",
      });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isClerk: false,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid or malformed authentication token. Please log in again.",
    });
  }
};

/**
 * Optional Authentication Middleware:
 * Extracts user if token is provided, without failing if token is missing
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return next();
  }

  try {
    const decodedMeta = jwt.decode(token, { complete: true });
    const isClerk =
      decodedMeta?.header?.alg === "RS256" ||
      (typeof decodedMeta?.payload?.iss === "string" && decodedMeta.payload.iss.includes("clerk"));

    if (isClerk) {
      req.user = await verifyClerkToken(token);
    } else {
      const secret = getJwtSecret();
      const decoded = jwt.verify(token, secret, { algorithms: [JWT_ALGORITHM] });
      if (decoded && decoded.id) {
        const user = findUserById(decoded.id);
        if (user) {
          req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isClerk: false,
          };
        }
      }
    }
  } catch {
    // Non-blocking for optional authentication
  }

  next();
};

// Middleware to strictly enforce Admin role (Returns 403 Forbidden for non-admins)
export const requireAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    const isUserAdmin =
      req.user && (req.user.role === "admin" || isEmailAdmin(req.user.email));
    if (isUserAdmin) {
      if (req.user && req.user.role !== "admin") {
        req.user.role = "admin";
      }
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied. Administrator privileges are required to perform this action.",
      });
    }
  });
};
