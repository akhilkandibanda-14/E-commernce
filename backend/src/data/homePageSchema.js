// Sanitises admin edits to the home page (site content `homePage`).
// Only these sections and fields are kept; the storefront fills anything missing
// from its own defaults (frontend/src/data/homePageDefaults.js).

const TEXT_MAX = 600;
const LONG_TEXT_MAX = 2000;
const LIST_MAX = 12;

const SECTION_KEYS = [
  "hero", "trustStrip", "newArrivals", "featuredCollections", "bestSellers", "services",
  "brands", "promoBanner", "brandStory", "testimonials", "reassurance", "newsletter",
];

// Field type per section: "text", "long", "url" (image), "link", "bool", "number",
// "strings" (list of text), or { list: {...item fields} }.
const SCHEMA = {
  sections: Object.fromEntries(SECTION_KEYS.map((k) => [k, "bool"])),
  hero: {
    title: "text", lead: "long", primaryCtaText: "text", primaryCtaLink: "link",
    secondaryCtaText: "text", image: "url", imageAlt: "text", tagTitle: "text", tagText: "text",
    promises: "strings",
  },
  trustStrip: { items: { list: { icon: "icon", title: "text", description: "long" } } },
  newArrivals: { title: "text", subtitle: "long" },
  bestSellers: { title: "text", subtitle: "long" },
  featuredCollections: {
    title: "text", subtitle: "long",
    items: { list: { title: "text", description: "long", image: "url", link: "link", tag: "text" } },
  },
  promoBanner: {
    kicker: "text", title: "text", text: "long", ctaText: "text", ctaLink: "link", note: "text",
    image: "url", imageAlt: "text",
  },
  reassurance: {
    title: "text", subtitle: "long",
    items: { list: { icon: "icon", title: "text", detail: "long", actionText: "text", link: "link", badge: "text" } },
  },
  testimonials: {
    title: "text", subtitle: "long", isSample: "bool",
    items: { list: { name: "text", location: "text", role: "text", rating: "number", title: "text", comment: "long", item: "text" } },
  },
  newsletter: { title: "text", text: "long", buttonText: "text" },
};

const isSafeUrl = (v) => /^(https?:\/\/|\/(?!\/))/i.test(v);

const cleanValue = (type, value, path) => {
  if (value === undefined) return undefined;
  if (type === "bool") return Boolean(value);
  if (type === "number") {
    const n = Number(value);
    if (!Number.isFinite(n)) throw new Error(`${path} must be a number.`);
    return Math.max(0, Math.min(5, n));
  }
  if (type === "strings") {
    if (!Array.isArray(value)) throw new Error(`${path} must be a list.`);
    return value.slice(0, LIST_MAX).map((s) => String(s ?? "").trim().slice(0, TEXT_MAX)).filter(Boolean);
  }
  if (typeof type === "object" && type.list) {
    if (!Array.isArray(value)) throw new Error(`${path} must be a list.`);
    return value.slice(0, LIST_MAX).map((item, i) => cleanObject(type.list, item || {}, `${path}[${i}]`));
  }
  const text = String(value ?? "").trim();
  if (type === "url" || type === "link") {
    if (text && !isSafeUrl(text)) {
      throw new Error(`${path} must start with https://, http:// or / (got "${text.slice(0, 40)}").`);
    }
    return text.slice(0, LONG_TEXT_MAX);
  }
  if (type === "icon") return text.replace(/[^a-z0-9 -]/gi, "").slice(0, 80);
  return text.slice(0, type === "long" ? LONG_TEXT_MAX : TEXT_MAX);
};

const cleanObject = (shape, input, path) => {
  const out = {};
  for (const [field, type] of Object.entries(shape)) {
    const v = cleanValue(type, input[field], `${path}.${field}`);
    if (v !== undefined) out[field] = v;
  }
  return out;
};

/** Returns a sanitised copy of the stored home page (unknown keys dropped). */
export const normalizeHomePage = (raw) => {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [section, shape] of Object.entries(SCHEMA)) {
    if (raw[section] && typeof raw[section] === "object") {
      try {
        out[section] = cleanObject(shape, raw[section], section);
      } catch {
        // Skip a section that was corrupted on disk rather than failing every page load.
      }
    }
  }
  return out;
};

/** Validates one admin update; throws with a readable message on bad input. */
export const sanitizeHomePageUpdate = (update) => {
  if (!update || typeof update !== "object" || Array.isArray(update)) {
    throw new Error("Send the home page sections to update as an object.");
  }
  const out = {};
  for (const [section, value] of Object.entries(update)) {
    const shape = SCHEMA[section];
    if (!shape) throw new Error(`Unknown home page section "${section}".`);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`Section "${section}" must be an object.`);
    }
    out[section] = cleanObject(shape, value, section);
  }
  return out;
};
