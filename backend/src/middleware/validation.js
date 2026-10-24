/**
 * Centralized Input Validation & Sanitization Middleware
 * Defends against malformed payloads, injection, prototype pollution,
 * excessive string lengths, and internal field tampering.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validate positive integer ID in request parameters (e.g. /:id)
export const validateIdParam = (paramName = "id") => {
  return (req, res, next) => {
    const rawValue = req.params[paramName];
    if (typeof rawValue !== "string" || !rawValue.trim()) {
      return res.status(400).json({
        success: false,
        message: `Missing required parameter '${paramName}'.`,
      });
    }

    const parsed = parseInt(rawValue, 10);
    if (!Number.isInteger(parsed) || parsed <= 0 || String(parsed) !== rawValue.trim()) {
      return res.status(400).json({
        success: false,
        message: `Invalid '${paramName}' parameter. Must be a positive integer.`,
      });
    }

    req.validatedId = parsed;
    next();
  };
};

// Validate and sanitize catalog query parameters (search, filter, sort, pagination)
export const validateCatalogQueryParams = (req, res, next) => {
  const { search, category, subcategory, style, minPrice, maxPrice, sort, page, limit } = req.query;

  // 1. Sanitize search query (cap to 100 characters, remove control characters)
  if (search !== undefined) {
    if (typeof search !== "string") {
      req.query.search = "";
    } else {
      req.query.search = search.replace(/[\x00-\x1F\x7F]/g, "").slice(0, 100);
    }
  }

  // Sanitize subcategory query parameter if present
  if (subcategory !== undefined) {
    if (typeof subcategory !== "string") {
      req.query.subcategory = "";
    } else {
      req.query.subcategory = subcategory.replace(/[\x00-\x1F\x7F]/g, "").slice(0, 100);
    }
  }

  // 2. Validate price filters (must be finite, non-negative numbers)
  if (minPrice !== undefined) {
    const num = Number(minPrice);
    if (isNaN(num) || !isFinite(num) || num < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid 'minPrice' parameter. Must be a non-negative number.",
      });
    }
    req.query.minPrice = num;
  }

  if (maxPrice !== undefined) {
    const num = Number(maxPrice);
    if (isNaN(num) || !isFinite(num) || num < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid 'maxPrice' parameter. Must be a non-negative number.",
      });
    }
    req.query.maxPrice = num;
  }

  // 3. Validate pagination parameters
  if (page !== undefined) {
    const p = parseInt(page, 10);
    if (isNaN(p) || p <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid 'page' parameter. Must be a positive integer.",
      });
    }
    req.query.page = p;
  }

  if (limit !== undefined) {
    const l = parseInt(limit, 10);
    if (isNaN(l) || l <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid 'limit' parameter. Must be a positive integer.",
      });
    }
    // Cap limit to 100 to prevent denial of service through huge payloads
    req.query.limit = Math.min(l, 100);
  }

  // 4. Validate allowed sort options
  const ALLOWED_SORTS = ["most-popular", "price-low", "price-high", "rating", "newest"];
  if (sort && typeof sort === "string" && !ALLOWED_SORTS.includes(sort.trim())) {
    // If unknown sort provided, safely fall back to default rather than failing
    req.query.sort = "most-popular";
  }

  next();
};

// Validate product creation payload (POST /api/products)
export const validateProductCreatePayload = (req, res, next) => {
  const { title, price, originalPrice, category, subcategory, style, description, moq } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: "Product title is required and must be a non-empty string.",
    });
  }

  if (title.trim().length > 200) {
    return res.status(400).json({
      success: false,
      message: "Product title cannot exceed 200 characters.",
    });
  }

  const numPrice = Number(price);
  if (price === undefined || isNaN(numPrice) || !isFinite(numPrice) || numPrice <= 0 || numPrice > 1000000) {
    return res.status(400).json({
      success: false,
      message: "A valid positive price (up to ₹1,000,000) is required.",
    });
  }

  if (originalPrice !== undefined) {
    const numOrig = Number(originalPrice);
    if (isNaN(numOrig) || !isFinite(numOrig) || numOrig < 0 || numOrig > 1000000) {
      return res.status(400).json({
        success: false,
        message: "Original price must be a valid positive number.",
      });
    }
  }

  if (!category || typeof category !== "string" || !category.trim()) {
    return res.status(400).json({
      success: false,
      message: "Category is required and must be a string.",
    });
  }

  if (category.trim().length > 50) {
    return res.status(400).json({
      success: false,
      message: "Category cannot exceed 50 characters.",
    });
  }

  if (subcategory && (typeof subcategory !== "string" || subcategory.trim().length > 100)) {
    return res.status(400).json({
      success: false,
      message: "Subcategory cannot exceed 100 characters.",
    });
  }

  if (style && (typeof style !== "string" || style.trim().length > 50)) {
    return res.status(400).json({
      success: false,
      message: "Style cannot exceed 50 characters.",
    });
  }

  if (description && (typeof description !== "string" || description.length > 2000)) {
    return res.status(400).json({
      success: false,
      message: "Description cannot exceed 2,000 characters.",
    });
  }

  if (moq !== undefined) {
    const numMoq = Number(moq);
    if (!Number.isInteger(numMoq) || numMoq <= 0 || numMoq > 50000) {
      return res.status(400).json({
        success: false,
        message: "MOQ must be a positive integer up to 50,000.",
      });
    }
  }

  next();
};

// Validate and whitelist product update payload (PUT /api/products/:id)
// Strictly prevents tampering with protected fields: id, createdAt, createdBy
export const validateProductUpdatePayload = (req, res, next) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({
      success: false,
      message: "Update payload must be a valid JSON object.",
    });
  }

  const ALLOWED_UPDATE_FIELDS = [
    "title",
    "price",
    "originalPrice",
    "category",
    "subcategory",
    "style",
    "brand",
    "sku",
    "description",
    "features",
    "specs",
    "sizes",
    "colors",
    "image",
    "images",
    "moq",
    "deliveryDays",
    "unitLabel",
    "priceNote",
    "isNew",
    "isBestSeller",
  ];

  // Disallow updates to protected internal properties
  const PROTECTED_FIELDS = ["id", "createdAt", "createdBy", "_id"];
  for (const field of PROTECTED_FIELDS) {
    if (field in req.body) {
      delete req.body[field];
    }
  }

  // Validate fields if provided in update
  if (req.body.title !== undefined) {
    if (typeof req.body.title !== "string" || !req.body.title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title must be a non-empty string.",
      });
    }
    if (req.body.title.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: "Title cannot exceed 200 characters.",
      });
    }
  }

  if (req.body.price !== undefined) {
    const numPrice = Number(req.body.price);
    if (isNaN(numPrice) || !isFinite(numPrice) || numPrice <= 0 || numPrice > 1000000) {
      return res.status(400).json({
        success: false,
        message: "Price must be a positive finite number up to ₹1,000,000.",
      });
    }
  }

  if (req.body.originalPrice !== undefined) {
    const numOrig = Number(req.body.originalPrice);
    if (isNaN(numOrig) || !isFinite(numOrig) || numOrig <= 0 || numOrig > 1000000) {
      return res.status(400).json({
        success: false,
        message: "Original price must be a positive finite number.",
      });
    }
  }

  if (req.body.category !== undefined) {
    if (typeof req.body.category !== "string" || !req.body.category.trim() || req.body.category.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Category must be a non-empty string up to 50 characters.",
      });
    }
  }

  // Sanitize to only allowed fields
  const sanitized = {};
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (key in req.body) {
      sanitized[key] = req.body[key];
    }
  }

  req.sanitizedUpdates = sanitized;
  next();
};

// Validate corporate quote payload (POST /api/quote)
export const validateQuotePayload = (req, res, next) => {
  const { contactEmail, contactPhone, companyName, quantity, notes } = req.body || {};

  if (!contactEmail || typeof contactEmail !== "string" || !EMAIL_REGEX.test(contactEmail.trim())) {
    return res.status(400).json({
      success: false,
      message: "A valid contact email address is required.",
    });
  }

  if (contactPhone && (typeof contactPhone !== "string" || contactPhone.trim().length > 30)) {
    return res.status(400).json({
      success: false,
      message: "Contact phone cannot exceed 30 characters.",
    });
  }

  if (companyName && (typeof companyName !== "string" || companyName.trim().length > 100)) {
    return res.status(400).json({
      success: false,
      message: "Company name cannot exceed 100 characters.",
    });
  }

  if (quantity !== undefined) {
    const q = Number(quantity);
    if (!Number.isInteger(q) || q <= 0 || q > 100000) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be an integer between 1 and 100,000.",
      });
    }
  }

  if (notes && (typeof notes !== "string" || notes.length > 1000)) {
    return res.status(400).json({
      success: false,
      message: "Notes cannot exceed 1,000 characters.",
    });
  }

  next();
};

// Validates POST /api/enquiries (bulk enquiries and catalogue requests)
export const validateEnquiryPayload = (req, res, next) => {
  const { email, name, phone, company, notes } = req.body || {};

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: "A valid email address is required.",
    });
  }

  const tooLong = [
    ["name", name, 100],
    ["phone", phone, 30],
    ["company", company, 100],
  ].find(([, value, max]) => value !== undefined && (typeof value !== "string" || value.trim().length > max));
  if (tooLong) {
    return res.status(400).json({
      success: false,
      message: `${tooLong[0][0].toUpperCase() + tooLong[0].slice(1)} cannot exceed ${tooLong[2]} characters.`,
    });
  }

  if (notes && (typeof notes !== "string" || notes.length > 1000)) {
    return res.status(400).json({
      success: false,
      message: "Notes cannot exceed 1,000 characters.",
    });
  }

  next();
};

// Standard color names to HEX map
export const KNOWN_COLORS = {
  "black": "#000000",
  "matte black": "#1c1917",
  "white": "#ffffff",
  "pearl white": "#f8fafc",
  "red": "#ef4444",
  "crimson": "#dc2626",
  "blue": "#3b82f6",
  "navy": "#1e3a8a",
  "navy blue": "#1e3a8a",
  "royal blue": "#1d4ed8",
  "sky blue": "#0ea5e9",
  "grey": "#6b7280",
  "gray": "#6b7280",
  "slate": "#475569",
  "slate grey": "#475569",
  "slate gray": "#475569",
  "dark grey": "#374151",
  "light grey": "#e5e7eb",
  "green": "#10b981",
  "forest green": "#15803d",
  "olive": "#84cc16",
  "yellow": "#f59e0b",
  "orange": "#f97316",
  "purple": "#8b5cf6",
  "indigo": "#4f46e5",
  "pink": "#ec4899",
  "brown": "#78350f",
  "beige": "#f5f5dc",
  "tan": "#d2b48c",
  "gold": "#d97706",
  "silver": "#94a3b8",
  "teal": "#14b8a6",
  "cyan": "#06b6d4",
  "maroon": "#800000",
  "burgundy": "#800020",
  "cork": "#c49a6c",
};

export const HEX_TO_NAME = {
  "#000000": "Black",
  "#1c1917": "Matte Black",
  "#ffffff": "White",
  "#f8fafc": "Pearl White",
  "#ef4444": "Red",
  "#dc2626": "Crimson",
  "#3b82f6": "Blue",
  "#1e3a8a": "Navy Blue",
  "#1d4ed8": "Royal Blue",
  "#0ea5e9": "Sky Blue",
  "#6b7280": "Grey",
  "#475569": "Slate Grey",
  "#374151": "Dark Grey",
  "#e5e7eb": "Light Grey",
  "#10b981": "Green",
  "#15803d": "Forest Green",
  "#84cc16": "Olive",
  "#f59e0b": "Yellow",
  "#f97316": "Orange",
  "#8b5cf6": "Purple",
  "#4f46e5": "Indigo",
  "#ec4899": "Pink",
  "#78350f": "Brown",
  "#f5f5dc": "Beige",
  "#d2b48c": "Tan",
  "#d97706": "Gold",
  "#94a3b8": "Silver",
  "#14b8a6": "Teal",
  "#06b6d4": "Cyan",
  "#800000": "Maroon",
  "#800020": "Burgundy",
  "#c49a6c": "Cork",
};

export const HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export const normalizeProductColor = (input) => {
  if (!input) return null;

  // 1. Existing { name, hex } object
  if (typeof input === "object" && !Array.isArray(input)) {
    const rawName = typeof input.name === "string" ? input.name.trim() : "";
    let rawHex = typeof input.hex === "string" ? input.hex.trim() : "";

    // If hex was provided, validate it strictly
    if (rawHex) {
      if (!rawHex.startsWith("#") && /^[0-9A-Fa-f]{3,6}$/.test(rawHex)) {
        rawHex = "#" + rawHex;
      }
      if (!HEX_REGEX.test(rawHex)) {
        return null; // Malformed hex in object
      }
    } else if (rawName) {
      const lookup = KNOWN_COLORS[rawName.toLowerCase()];
      if (lookup) rawHex = lookup;
    }

    if (rawHex && HEX_REGEX.test(rawHex)) {
      const validName = rawName || HEX_TO_NAME[rawHex.toLowerCase()] || rawHex.toUpperCase();
      return { name: validName.slice(0, 50), hex: rawHex.toLowerCase() };
    }

    // If only name provided without hex and not in lookup, verify name has alphanumeric content
    if (rawName && /[a-zA-Z0-9]/.test(rawName)) {
      return { name: rawName.slice(0, 50), hex: "#475569" };
    }
    return null;
  }

  // 2. Plain string
  if (typeof input === "string") {
    const str = input.trim();
    if (!str) return null;

    // 2a. If it starts with '#', it MUST be a valid hex code
    if (str.startsWith("#")) {
      if (HEX_REGEX.test(str)) {
        const lowerHex = str.toLowerCase();
        const name = HEX_TO_NAME[lowerHex] || str.toUpperCase();
        return { name, hex: lowerHex };
      }
      return null; // Invalid hex string
    }

    // 2b. Check if it's a 3 or 6 char raw hex without '#'
    if ((str.length === 3 || str.length === 6) && /^[0-9A-Fa-f]+$/.test(str)) {
      const formattedHex = "#" + str.toLowerCase();
      const name = HEX_TO_NAME[formattedHex] || ("#" + str).toUpperCase();
      return { name, hex: formattedHex };
    }

    // 2c. Known color name
    const lookup = KNOWN_COLORS[str.toLowerCase()];
    if (lookup) {
      const formatted = str
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      return { name: formatted, hex: lookup };
    }

    // 2d. Custom color name: must have valid alphanumeric characters and reasonable length
    if (/[a-zA-Z0-9]/.test(str) && str.length <= 50) {
      return {
        name: str.slice(0, 50),
        hex: "#475569",
      };
    }

    return null;
  }

  return null;
};

export const normalizeProductColors = (colors) => {
  if (!Array.isArray(colors)) return [];
  return colors.map(normalizeProductColor).filter(Boolean);
};

// Validate Bulk Product Import Payload (POST /api/products/bulk-import)
export const validateBulkImportPayload = (req, res, next) => {
  let products = req.body;
  let duplicateStrategy = (req.query?.duplicateStrategy || "skip").toLowerCase();
  let dryRun = req.query?.dryRun === "true" || req.query?.dryRun === true;

  // Accept either an object { products: [...], duplicateStrategy, dryRun } or raw array [...]
  if (req.body && typeof req.body === "object" && !Array.isArray(req.body)) {
    if (Array.isArray(req.body.products)) {
      products = req.body.products;
    }
    if (typeof req.body.duplicateStrategy === "string") {
      duplicateStrategy = req.body.duplicateStrategy.trim().toLowerCase();
    }
    if (req.body.dryRun !== undefined) {
      dryRun = Boolean(req.body.dryRun);
    }
  }

  const ALLOWED_STRATEGIES = ["skip", "update", "error"];
  if (!ALLOWED_STRATEGIES.includes(duplicateStrategy)) {
    return res.status(400).json({
      success: false,
      message: `Invalid duplicateStrategy '${duplicateStrategy}'. Allowed values: ${ALLOWED_STRATEGIES.join(", ")}.`,
    });
  }

  if (!Array.isArray(products)) {
    return res.status(400).json({
      success: false,
      message: "Import payload must be a JSON array of products or an object containing a 'products' array.",
    });
  }

  if (products.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Import batch cannot be empty. Minimum 1 product required.",
    });
  }

  if (products.length > 500) {
    return res.status(400).json({
      success: false,
      message: `Import batch exceeds maximum limit of 500 products per request. Received: ${products.length} products.`,
    });
  }

  const errors = [];
  const sanitizedProducts = [];
  const seenBatchSkus = new Map(); // normalized SKU -> row number
  const seenBatchIds = new Map();  // numeric ID -> row number

  const SKU_REGEX = /^[A-Za-z0-9_.-]+$/;
  const PROTECTED_FIELDS = ["createdAt", "createdBy", "updatedAt", "updatedBy", "role", "_id"];

  for (let i = 0; i < products.length; i++) {
    const rowNum = i + 1;
    const raw = products[i];

    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      errors.push({
        row: rowNum,
        field: "row",
        message: "Each product row must be a valid JSON object.",
      });
      continue;
    }

    // Clone and strip protected internal fields
    const item = { ...raw };
    for (const pf of PROTECTED_FIELDS) {
      delete item[pf];
    }

    // Product MRP handling: Product MRP is the initial selling price when price is omitted,
    // and originalPrice should represent catalogue MRP where appropriate.
    if (item.mrp !== undefined && item.mrp !== null) {
      const numMrp = Number(item.mrp);
      if (item.price === undefined || item.price === null || item.price === "") {
        item.price = numMrp;
      }
      if (item.originalPrice === undefined || item.originalPrice === null || item.originalPrice === "") {
        item.originalPrice = numMrp;
      }
    }

    // 1. Title validation (required)
    if (!item.title || typeof item.title !== "string" || !item.title.trim()) {
      errors.push({
        row: rowNum,
        field: "title",
        message: "Product title is required and must be a non-empty string.",
      });
    } else if (item.title.trim().length > 200) {
      errors.push({
        row: rowNum,
        field: "title",
        message: "Product title cannot exceed 200 characters.",
      });
    }

    // 2. Price validation (required, positive, finite, up to ₹1,000,000)
    const numPrice = Number(item.price);
    if (
      item.price === undefined ||
      item.price === null ||
      isNaN(numPrice) ||
      !isFinite(numPrice) ||
      numPrice <= 0 ||
      numPrice > 1000000
    ) {
      errors.push({
        row: rowNum,
        field: "price",
        message: "Valid positive price (up to ₹1,000,000) is required.",
      });
    }

    // 3. Category validation (required)
    if (!item.category || typeof item.category !== "string" || !item.category.trim()) {
      errors.push({
        row: rowNum,
        field: "category",
        message: "Category is required and must be a string.",
      });
    } else if (item.category.trim().length > 50) {
      errors.push({
        row: rowNum,
        field: "category",
        message: "Category cannot exceed 50 characters.",
      });
    }

    // 4. originalPrice validation (optional)
    if (item.originalPrice !== undefined && item.originalPrice !== null) {
      const numOrig = Number(item.originalPrice);
      if (isNaN(numOrig) || !isFinite(numOrig) || numOrig < 0 || numOrig > 1000000) {
        errors.push({
          row: rowNum,
          field: "originalPrice",
          message: "Original price must be a valid positive number up to ₹1,000,000.",
        });
      }
    }

    // 5. SKU validation & within-batch uniqueness (optional, max 50 chars)
    if (item.sku !== undefined && item.sku !== null && String(item.sku).trim() !== "") {
      const skuStr = String(item.sku).trim();
      if (skuStr.length < 2 || skuStr.length > 50 || !SKU_REGEX.test(skuStr)) {
        errors.push({
          row: rowNum,
          field: "sku",
          message: "SKU must be 2–50 alphanumeric characters (hyphens, dots, underscores allowed).",
        });
      } else {
        const normSku = skuStr.toLowerCase();
        if (seenBatchSkus.has(normSku)) {
          errors.push({
            row: rowNum,
            field: "sku",
            message: `Duplicate SKU '${skuStr}' found within this import batch (already used at row ${seenBatchSkus.get(normSku)}).`,
          });
        } else {
          seenBatchSkus.set(normSku, rowNum);
        }
      }
    }

    // 6. ID validation & within-batch uniqueness (optional, positive integer)
    if (item.id !== undefined && item.id !== null) {
      const numId = Number(item.id);
      if (!Number.isInteger(numId) || numId <= 0) {
        errors.push({
          row: rowNum,
          field: "id",
          message: "Product ID must be a positive integer.",
        });
      } else {
        if (seenBatchIds.has(numId)) {
          errors.push({
            row: rowNum,
            field: "id",
            message: `Duplicate product ID '${numId}' found within this import batch (already used at row ${seenBatchIds.get(numId)}).`,
          });
        } else {
          seenBatchIds.set(numId, rowNum);
        }
      }
    }

    // 7. Optional text bounds
    if (item.style && (typeof item.style !== "string" || item.style.trim().length > 50)) {
      errors.push({
        row: rowNum,
        field: "style",
        message: "Style cannot exceed 50 characters.",
      });
    }

    if (item.brand && (typeof item.brand !== "string" || item.brand.trim().length > 50)) {
      errors.push({
        row: rowNum,
        field: "brand",
        message: "Brand cannot exceed 50 characters.",
      });
    }

    if (item.deliveryDays && (typeof item.deliveryDays !== "string" || item.deliveryDays.trim().length > 50)) {
      errors.push({
        row: rowNum,
        field: "deliveryDays",
        message: "Delivery days cannot exceed 50 characters.",
      });
    }

    if (item.description && (typeof item.description !== "string" || item.description.length > 2000)) {
      errors.push({
        row: rowNum,
        field: "description",
        message: "Description cannot exceed 2,000 characters.",
      });
    }

    if (item.moq !== undefined && item.moq !== null) {
      const numMoq = Number(item.moq);
      if (!Number.isInteger(numMoq) || numMoq <= 0 || numMoq > 50000) {
        errors.push({
          row: rowNum,
          field: "moq",
          message: "MOQ must be a positive integer between 1 and 50,000.",
        });
      }
    }

    // 8. Colors validation and normalization
    if (item.colors !== undefined && item.colors !== null) {
      if (!Array.isArray(item.colors) && typeof item.colors !== "string") {
        errors.push({
          row: rowNum,
          field: "colors",
          message: "Colors must be an array of color names, hex codes, or { name, hex } objects.",
        });
      } else {
        const rawList = Array.isArray(item.colors)
          ? item.colors
          : item.colors.split(",").map((c) => c.trim()).filter(Boolean);

        const normalizedList = normalizeProductColors(rawList);
        const hasInvalid = rawList.some((c) => !normalizeProductColor(c));
        if (hasInvalid) {
          errors.push({
            row: rowNum,
            field: "colors",
            message: "One or more color values are invalid. Expected valid color names, hex codes (#RRGGBB), or { name, hex } objects.",
          });
        } else {
          item.colors = normalizedList;
        }
      }
    }

    sanitizedProducts.push({
      ...item,
      rowNum,
    });
  }

  // If there are schema or format errors, reject before processing
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Validation failed for ${errors.length} item(s) in import batch.`,
      totalRows: products.length,
      errorCount: errors.length,
      errors,
    });
  }

  req.bulkImportData = {
    products: sanitizedProducts,
    duplicateStrategy,
    dryRun,
  };

  next();
};

