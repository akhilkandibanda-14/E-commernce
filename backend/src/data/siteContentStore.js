import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DEFAULT_SITE_CONTENT } from "./defaultSiteContent.js";
import { normalizeHomePage, sanitizeHomePageUpdate } from "./homePageSchema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const SITE_CONTENT_FILE = path.join(__dirname, "site_content.json");

// In-memory cache of site content
let siteContentCache = null;

/**
 * Validates and deep clones a site content object, ensuring fallback structures.
 */
const normalizeSiteContent = (raw) => {
  if (!raw || typeof raw !== "object") {
    return JSON.parse(JSON.stringify(DEFAULT_SITE_CONTENT));
  }

  return {
    announcement: {
      ...DEFAULT_SITE_CONTENT.announcement,
      ...(raw.announcement || {}),
    },
    brands: Array.isArray(raw.brands)
      ? raw.brands.map((b, idx) => ({
          id: b.id || `brand-${idx + 1}-${Date.now()}`,
          name: typeof b.name === "string" ? b.name.trim() : `Brand ${idx + 1}`,
          category: typeof b.category === "string" ? b.category.trim() : "General",
          tag: typeof b.tag === "string" ? b.tag.trim() : "",
          description: typeof b.description === "string" ? b.description.trim() : "",
          link: typeof b.link === "string" ? b.link.trim() : "",
        }))
      : JSON.parse(JSON.stringify(DEFAULT_SITE_CONTENT.brands)),
    aboutUs: {
      ...DEFAULT_SITE_CONTENT.aboutUs,
      ...(raw.aboutUs || {}),
      pillars: Array.isArray(raw.aboutUs?.pillars)
        ? raw.aboutUs.pillars.map((p, idx) => ({
            id: p.id || `pillar-${idx + 1}-${Date.now()}`,
            icon: p.icon || "fa-solid fa-star",
            title: p.title || "Core Value",
            description: p.description || "",
          }))
        : DEFAULT_SITE_CONTENT.aboutUs.pillars,
    },
    services: Array.isArray(raw.services)
      ? raw.services
      : JSON.parse(JSON.stringify(DEFAULT_SITE_CONTENT.services)),
    festiveGifts: Array.isArray(raw.festiveGifts)
      ? raw.festiveGifts
      : JSON.parse(JSON.stringify(DEFAULT_SITE_CONTENT.festiveGifts)),
    contactInfo: {
      ...DEFAULT_SITE_CONTENT.contactInfo,
      ...(raw.contactInfo || {}),
    },
    giftingCategories: Array.isArray(raw.giftingCategories)
      ? raw.giftingCategories.map((cat, idx) => ({
          id: cat.id || `cat-${idx + 1}-${Date.now()}`,
          name: typeof cat.name === "string" ? cat.name.trim() : `Category ${idx + 1}`,
          icon: cat.icon || "fa-solid fa-gift",
          badge: typeof cat.badge === "string" ? cat.badge.trim() : "",
          description: typeof cat.description === "string" ? cat.description.trim() : "",
          leadTime: typeof cat.leadTime === "string" ? cat.leadTime.trim() : "",
          highlightImg: typeof cat.highlightImg === "string" ? cat.highlightImg.trim() : "",
          brandingPromo: {
            title: cat.brandingPromo?.title || `Need Custom Corporate Branding on ${cat.name}?`,
            text: cat.brandingPromo?.text || "We provide Screen Printing, Laser Engraving & Digital UV logo placement with Pan-India dispatch.",
            buttonText: cat.brandingPromo?.buttonText || "Get Bulk Quotation",
          },
          subcategories: Array.isArray(cat.subcategories)
            ? cat.subcategories.map((sub, sIdx) => ({
                id: sub.id || `sub-${cat.id || idx}-${sIdx + 1}`,
                name: typeof sub.name === "string" ? sub.name.trim() : `Subcategory ${sIdx + 1}`,
                query: typeof sub.query === "string" ? sub.query.trim() : (sub.name || ""),
                icon: sub.icon || "fa-solid fa-tag",
              }))
            : [],
        }))
      : JSON.parse(JSON.stringify(DEFAULT_SITE_CONTENT.giftingCategories)),
    navigation: {
      brandLogo: {
        ...DEFAULT_SITE_CONTENT.navigation.brandLogo,
        ...(raw.navigation?.brandLogo || {}),
      },
      items: Array.isArray(raw.navigation?.items)
        ? raw.navigation.items.map((item, idx) => ({
            id: item.id || `nav-${item.key || idx + 1}`,
            key: item.key || `custom-${idx + 1}`,
            label: typeof item.label === "string" ? item.label : `Item ${idx + 1}`,
            type: item.type === "dropdown" ? "dropdown" : "link",
            path: item.path || "/",
            icon: item.icon || "fa-solid fa-link",
            badge: item.badge || "",
            enabled: item.enabled !== false,
            order: typeof item.order === "number" ? item.order : idx + 1,
          }))
        : DEFAULT_SITE_CONTENT.navigation.items,
      actions: {
        downloadCatalogues: {
          ...DEFAULT_SITE_CONTENT.navigation.actions.downloadCatalogues,
          ...(raw.navigation?.actions?.downloadCatalogues || {}),
        },
        bulkEnquiry: {
          ...DEFAULT_SITE_CONTENT.navigation.actions.bulkEnquiry,
          ...(raw.navigation?.actions?.bulkEnquiry || {}),
        },
      },
    },
    // Admin overrides for home page sections; defaults live in the storefront.
    homePage: normalizeHomePage(raw.homePage),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
};

/**
 * Loads site content from disk, initializing if missing or invalid.
 */
export const loadSiteContent = () => {
  if (siteContentCache) {
    return siteContentCache;
  }

  try {
    if (fs.existsSync(SITE_CONTENT_FILE)) {
      const data = fs.readFileSync(SITE_CONTENT_FILE, "utf-8");
      const parsed = JSON.parse(data);
      siteContentCache = normalizeSiteContent(parsed);
      return siteContentCache;
    }
  } catch (err) {
    console.warn("[SiteContentStore] Error loading site_content.json, using defaults:", err.message);
  }

  siteContentCache = normalizeSiteContent(DEFAULT_SITE_CONTENT);
  saveSiteContent(siteContentCache);
  return siteContentCache;
};

/**
 * Atomically writes site content to disk and updates in-memory cache.
 */
export const saveSiteContent = (content) => {
  const normalized = normalizeSiteContent({
    ...content,
    updatedAt: new Date().toISOString(),
  });

  const tmpPath = path.join(
    __dirname,
    `.site_content.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 7)}`
  );

  try {
    fs.writeFileSync(tmpPath, JSON.stringify(normalized, null, 2), "utf-8");
    fs.renameSync(tmpPath, SITE_CONTENT_FILE);
    siteContentCache = normalized;
    return siteContentCache;
  } catch (err) {
    if (fs.existsSync(tmpPath)) {
      try {
        fs.unlinkSync(tmpPath);
      } catch (_) {}
    }
    console.error("[SiteContentStore] Failed to save site_content.json:", err.message);
    throw err;
  }
};

/**
 * Add a new Brand
 */
export const addBrand = (brandData) => {
  const current = loadSiteContent();
  const name = (brandData.name || "").trim();
  if (!name) {
    throw new Error("Brand name is required");
  }

  const newBrand = {
    id: `brand-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    category: (brandData.category || "Lifestyle").trim(),
    tag: (brandData.tag || "").trim(),
    description: (brandData.description || "").trim(),
    link: (brandData.link || "").trim(),
  };

  const updatedBrands = [newBrand, ...current.brands];
  saveSiteContent({ ...current, brands: updatedBrands });
  return newBrand;
};

/**
 * Update an existing Brand
 */
export const updateBrand = (brandId, updates) => {
  const current = loadSiteContent();
  const index = current.brands.findIndex((b) => b.id === brandId || b.name.toLowerCase() === brandId.toLowerCase());
  if (index === -1) {
    throw new Error(`Brand with ID "${brandId}" not found`);
  }

  const existing = current.brands[index];
  const updated = {
    ...existing,
    name: typeof updates.name === "string" ? updates.name.trim() : existing.name,
    category: typeof updates.category === "string" ? updates.category.trim() : existing.category,
    tag: typeof updates.tag === "string" ? updates.tag.trim() : existing.tag,
    description: typeof updates.description === "string" ? updates.description.trim() : existing.description,
    link: typeof updates.link === "string" ? updates.link.trim() : existing.link,
  };

  current.brands[index] = updated;
  saveSiteContent(current);
  return updated;
};

/**
 * Delete a Brand by ID or name
 */
export const deleteBrand = (brandId) => {
  const current = loadSiteContent();
  const index = current.brands.findIndex((b) => b.id === brandId || b.name.toLowerCase() === brandId.toLowerCase());
  if (index === -1) {
    throw new Error(`Brand with ID "${brandId}" not found`);
  }

  const deleted = current.brands[index];
  current.brands.splice(index, 1);
  saveSiteContent(current);
  return deleted;
};

/**
 * Update About Us section
 */
export const updateAboutUs = (aboutUsData) => {
  const current = loadSiteContent();
  const updatedAboutUs = {
    ...current.aboutUs,
    ...aboutUsData,
  };
  saveSiteContent({ ...current, aboutUs: updatedAboutUs });
  return updatedAboutUs;
};

/**
 * Update Services list
 */
/**
 * Update one or more home page sections (hero, banners, testimonials, visibility, ...).
 * Each section sent replaces the saved version of that section.
 */
export const updateHomePage = (sectionsUpdate) => {
  const current = loadSiteContent();
  const cleaned = sanitizeHomePageUpdate(sectionsUpdate);
  const homePage = { ...(current.homePage || {}), ...cleaned };
  saveSiteContent({ ...current, homePage });
  return loadSiteContent().homePage;
};

export const updateServices = (servicesList) => {
  if (!Array.isArray(servicesList)) {
    throw new Error("Services must be an array");
  }
  const current = loadSiteContent();
  saveSiteContent({ ...current, services: servicesList });
  return current.services;
};

/**
 * Update Festive Gifts list
 */
export const updateFestiveGifts = (festiveList) => {
  if (!Array.isArray(festiveList)) {
    throw new Error("Festive gifts must be an array");
  }
  const current = loadSiteContent();
  saveSiteContent({ ...current, festiveGifts: festiveList });
  return current.festiveGifts;
};

/**
 * Update Contact Info
 */
export const updateContactInfo = (contactData) => {
  const current = loadSiteContent();
  const updatedContact = {
    ...current.contactInfo,
    ...contactData,
  };
  saveSiteContent({ ...current, contactInfo: updatedContact });
  return updatedContact;
};

/**
 * Update Announcement banner
 */
export const updateAnnouncement = (announcementData) => {
  const current = loadSiteContent();
  const updatedAnnouncement = {
    ...current.announcement,
    ...announcementData,
  };
  saveSiteContent({ ...current, announcement: updatedAnnouncement });
  return updatedAnnouncement;
};

/**
 * Update entire navigation configuration
 */
export const updateNavigation = (navData) => {
  const current = loadSiteContent();
  const updatedNav = {
    ...current.navigation,
    ...(navData || {}),
    brandLogo: {
      ...(current.navigation?.brandLogo || {}),
      ...(navData?.brandLogo || {}),
    },
    actions: {
      ...(current.navigation?.actions || {}),
      ...(navData?.actions || {}),
      downloadCatalogues: {
        ...(current.navigation?.actions?.downloadCatalogues || {}),
        ...(navData?.actions?.downloadCatalogues || {}),
      },
      bulkEnquiry: {
        ...(current.navigation?.actions?.bulkEnquiry || {}),
        ...(navData?.actions?.bulkEnquiry || {}),
      },
    },
  };
  const saved = saveSiteContent({ ...current, navigation: updatedNav });
  return saved.navigation;
};

/**
 * Add a new navigation item
 */
export const addNavItem = (itemData) => {
  const current = loadSiteContent();
  const label = (itemData.label || "").trim();
  if (!label) {
    throw new Error("Navigation item label is required");
  }

  const newItem = {
    id: `nav-${Date.now()}`,
    key: `custom-${Date.now()}`,
    label,
    type: itemData.type === "dropdown" ? "dropdown" : "link",
    path: (itemData.path || "/products").trim(),
    icon: (itemData.icon || "fa-solid fa-link").trim(),
    badge: (itemData.badge || "").trim(),
    enabled: itemData.enabled !== false,
    order: (current.navigation?.items?.length || 0) + 1,
  };

  const updatedItems = [...(current.navigation?.items || []), newItem];
  const updatedNav = {
    ...current.navigation,
    items: updatedItems,
  };
  saveSiteContent({ ...current, navigation: updatedNav });
  return newItem;
};

/**
 * Update an existing navigation item
 */
export const updateNavItem = (itemId, updates) => {
  const current = loadSiteContent();
  const items = [...(current.navigation?.items || [])];
  const index = items.findIndex((it) => it.id === itemId || it.key === itemId);
  if (index === -1) {
    throw new Error(`Navigation item with ID "${itemId}" not found`);
  }

  const existing = items[index];
  const updated = {
    ...existing,
    label: typeof updates.label === "string" ? updates.label.trim() : existing.label,
    path: typeof updates.path === "string" ? updates.path.trim() : existing.path,
    icon: typeof updates.icon === "string" ? updates.icon.trim() : existing.icon,
    badge: typeof updates.badge === "string" ? updates.badge.trim() : existing.badge,
    enabled: typeof updates.enabled === "boolean" ? updates.enabled : existing.enabled,
    order: typeof updates.order === "number" ? updates.order : existing.order,
  };

  items[index] = updated;
  saveSiteContent({
    ...current,
    navigation: {
      ...current.navigation,
      items,
    },
  });
  return updated;
};

/**
 * Delete a navigation item
 */
export const deleteNavItem = (itemId) => {
  const current = loadSiteContent();
  const items = [...(current.navigation?.items || [])];
  const index = items.findIndex((it) => it.id === itemId || it.key === itemId);
  if (index === -1) {
    throw new Error(`Navigation item with ID "${itemId}" not found`);
  }

  const deleted = items.splice(index, 1)[0];
  saveSiteContent({
    ...current,
    navigation: {
      ...current.navigation,
      items,
    },
  });
  return deleted;
};

/**
 * Update all gifting categories (e.g. reordering or batch update)
 */
export const updateGiftingCategories = (categoriesList) => {
  const current = loadSiteContent();
  if (!Array.isArray(categoriesList)) {
    throw new Error("Categories must be an array");
  }
  const saved = saveSiteContent({
    ...current,
    giftingCategories: categoriesList,
  });
  return saved.giftingCategories;
};

/**
 * Add a new gifting category
 */
export const addGiftingCategory = (categoryData) => {
  const current = loadSiteContent();
  const name = (categoryData.name || "").trim();
  if (!name) {
    throw new Error("Category name is required");
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const newCat = {
    id: categoryData.id || `${slug}-${Date.now()}`,
    name,
    icon: (categoryData.icon || "fa-solid fa-gift").trim(),
    badge: (categoryData.badge || "").trim(),
    description: (categoryData.description || "").trim(),
    leadTime: (categoryData.leadTime || "3–5 Days Turnaround").trim(),
    highlightImg: (categoryData.highlightImg || "").trim(),
    brandingPromo: {
      title: categoryData.brandingPromo?.title || `Need Custom Corporate Branding on ${name}?`,
      text: categoryData.brandingPromo?.text || "We provide Screen Printing, Laser Engraving & Digital UV logo placement with Pan-India dispatch.",
      buttonText: categoryData.brandingPromo?.buttonText || "Get Bulk Quotation",
    },
    subcategories: Array.isArray(categoryData.subcategories) ? categoryData.subcategories : [],
  };

  const updatedCategories = [...(current.giftingCategories || []), newCat];
  saveSiteContent({ ...current, giftingCategories: updatedCategories });
  return newCat;
};

/**
 * Update a gifting category
 */
export const updateGiftingCategory = (categoryId, updates) => {
  const current = loadSiteContent();
  const categories = [...(current.giftingCategories || [])];
  const index = categories.findIndex((c) => c.id === categoryId);
  if (index === -1) {
    throw new Error(`Category with ID "${categoryId}" not found`);
  }

  const existing = categories[index];
  const updated = {
    ...existing,
    name: typeof updates.name === "string" ? updates.name.trim() : existing.name,
    icon: typeof updates.icon === "string" ? updates.icon.trim() : existing.icon,
    badge: typeof updates.badge === "string" ? updates.badge.trim() : existing.badge,
    description: typeof updates.description === "string" ? updates.description.trim() : existing.description,
    leadTime: typeof updates.leadTime === "string" ? updates.leadTime.trim() : existing.leadTime,
    highlightImg: typeof updates.highlightImg === "string" ? updates.highlightImg.trim() : existing.highlightImg,
    brandingPromo: {
      ...existing.brandingPromo,
      ...(updates.brandingPromo || {}),
    },
    subcategories: Array.isArray(updates.subcategories) ? updates.subcategories : existing.subcategories,
  };

  categories[index] = updated;
  saveSiteContent({ ...current, giftingCategories: categories });
  return updated;
};

/**
 * Delete a gifting category
 */
export const deleteGiftingCategory = (categoryId) => {
  const current = loadSiteContent();
  const categories = [...(current.giftingCategories || [])];
  const index = categories.findIndex((c) => c.id === categoryId);
  if (index === -1) {
    throw new Error(`Category with ID "${categoryId}" not found`);
  }

  const deleted = categories.splice(index, 1)[0];
  saveSiteContent({ ...current, giftingCategories: categories });
  return deleted;
};

/**
 * Add a subcategory to a specific gifting category
 */
export const addSubcategory = (categoryId, subcategoryData) => {
  const current = loadSiteContent();
  const categories = [...(current.giftingCategories || [])];
  const index = categories.findIndex((c) => c.id === categoryId);
  if (index === -1) {
    throw new Error(`Category with ID "${categoryId}" not found`);
  }

  const name = (subcategoryData.name || "").trim();
  if (!name) {
    throw new Error("Subcategory name is required");
  }

  const newSub = {
    id: `sub-${categoryId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    query: (subcategoryData.query || name).trim(),
    icon: (subcategoryData.icon || "fa-solid fa-tag").trim(),
  };

  const existingSubs = Array.isArray(categories[index].subcategories) ? categories[index].subcategories : [];
  categories[index] = {
    ...categories[index],
    subcategories: [...existingSubs, newSub],
  };

  saveSiteContent({ ...current, giftingCategories: categories });
  return newSub;
};

/**
 * Update a subcategory
 */
export const updateSubcategory = (categoryId, subId, updates) => {
  const current = loadSiteContent();
  const categories = [...(current.giftingCategories || [])];
  const catIndex = categories.findIndex((c) => c.id === categoryId);
  if (catIndex === -1) {
    throw new Error(`Category with ID "${categoryId}" not found`);
  }

  const subcategories = [...(categories[catIndex].subcategories || [])];
  const subIndex = subcategories.findIndex((s) => s.id === subId || s.name === subId);
  if (subIndex === -1) {
    throw new Error(`Subcategory with ID "${subId}" not found in category "${categoryId}"`);
  }

  const existing = subcategories[subIndex];
  const updated = {
    ...existing,
    name: typeof updates.name === "string" ? updates.name.trim() : existing.name,
    query: typeof updates.query === "string" ? updates.query.trim() : existing.query,
    icon: typeof updates.icon === "string" ? updates.icon.trim() : existing.icon,
  };

  subcategories[subIndex] = updated;
  categories[catIndex] = {
    ...categories[catIndex],
    subcategories,
  };

  saveSiteContent({ ...current, giftingCategories: categories });
  return updated;
};

/**
 * Delete a subcategory
 */
export const deleteSubcategory = (categoryId, subId) => {
  const current = loadSiteContent();
  const categories = [...(current.giftingCategories || [])];
  const catIndex = categories.findIndex((c) => c.id === categoryId);
  if (catIndex === -1) {
    throw new Error(`Category with ID "${categoryId}" not found`);
  }

  const subcategories = [...(categories[catIndex].subcategories || [])];
  const subIndex = subcategories.findIndex((s) => s.id === subId || s.name === subId);
  if (subIndex === -1) {
    throw new Error(`Subcategory with ID "${subId}" not found in category "${categoryId}"`);
  }

  const deleted = subcategories.splice(subIndex, 1)[0];
  categories[catIndex] = {
    ...categories[catIndex],
    subcategories,
  };

  saveSiteContent({ ...current, giftingCategories: categories });
  return deleted;
};

/**
 * Reset site content to system defaults
 */
export const resetSiteContentToDefaults = () => {
  const defaults = JSON.parse(JSON.stringify(DEFAULT_SITE_CONTENT));
  saveSiteContent(defaults);
  return defaults;
};

