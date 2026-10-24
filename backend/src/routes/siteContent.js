import express from "express";
import {
  loadSiteContent,
  saveSiteContent,
  addBrand,
  updateBrand,
  deleteBrand,
  updateAboutUs,
  updateHomePage,
  updateServices,
  updateFestiveGifts,
  updateContactInfo,
  updateAnnouncement,
  updateNavigation,
  addNavItem,
  updateNavItem,
  deleteNavItem,
  updateGiftingCategories,
  addGiftingCategory,
  updateGiftingCategory,
  deleteGiftingCategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
  resetSiteContentToDefaults,
} from "../data/siteContentStore.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/site-content
 * Public endpoint to fetch full site content & branding details.
 */
router.get("/", (req, res) => {
  try {
    const content = loadSiteContent();
    res.json({
      success: true,
      content,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to load site content: " + err.message,
    });
  }
});

/**
 * PUT /api/site-content
 * Admin: Full content update.
 */
router.put("/", requireAdmin, (req, res) => {
  try {
    const updated = saveSiteContent(req.body);
    res.json({
      success: true,
      message: "Site content updated successfully",
      content: updated,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || "Failed to update site content",
    });
  }
});

/**
 * POST /api/site-content/brands
 * Admin: Add a new brand
 */
router.post("/brands", requireAdmin, (req, res) => {
  try {
    const { name, category, tag, description, link } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Brand name is required",
      });
    }

    const brand = addBrand({ name, category, tag, description, link });
    res.status(201).json({
      success: true,
      message: `Brand "${brand.name}" added successfully`,
      brand,
      brands: loadSiteContent().brands,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || "Failed to add brand",
    });
  }
});

/**
 * PUT /api/site-content/brands/:id
 * Admin: Edit an existing brand
 */
router.put("/brands/:id", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const brand = updateBrand(id, req.body);
    res.json({
      success: true,
      message: `Brand "${brand.name}" updated successfully`,
      brand,
      brands: loadSiteContent().brands,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err.message || "Failed to update brand",
    });
  }
});

/**
 * DELETE /api/site-content/brands/:id
 * Admin: Delete a brand
 */
router.delete("/brands/:id", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const deleted = deleteBrand(id);
    res.json({
      success: true,
      message: `Brand "${deleted.name}" deleted successfully`,
      deleted,
      brands: loadSiteContent().brands,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err.message || "Failed to delete brand",
    });
  }
});

/**
 * PUT /api/site-content/about-us
 * Admin: Update About Us / Brand Story details
 */
router.put("/about-us", requireAdmin, (req, res) => {
  try {
    const aboutUs = updateAboutUs(req.body);
    res.json({
      success: true,
      message: "About Us content updated successfully",
      aboutUs,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || "Failed to update About Us content",
    });
  }
});

/**
 * PUT /api/site-content/home-page
 * Admin: Update home page sections, e.g. { hero: {...}, sections: { promoBanner: false } }
 */
router.put("/home-page", requireAdmin, (req, res) => {
  try {
    const homePage = updateHomePage(req.body);
    res.json({
      success: true,
      message: "Home page updated successfully",
      homePage,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || "Failed to update home page",
    });
  }
});

/**
 * PUT /api/site-content/services
 * Admin: Update Services
 */
router.put("/services", requireAdmin, (req, res) => {
  try {
    const services = updateServices(req.body.services || req.body);
    res.json({
      success: true,
      message: "Services updated successfully",
      services,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || "Failed to update services",
    });
  }
});

/**
 * PUT /api/site-content/festive-gifts
 * Admin: Update Festive Gifts
 */
router.put("/festive-gifts", requireAdmin, (req, res) => {
  try {
    const festiveGifts = updateFestiveGifts(req.body.festiveGifts || req.body);
    res.json({
      success: true,
      message: "Festive gifts updated successfully",
      festiveGifts,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || "Failed to update festive gifts",
    });
  }
});

/**
 * PUT /api/site-content/contact-info
 * Admin: Update Contact Information
 */
router.put("/contact-info", requireAdmin, (req, res) => {
  try {
    const contactInfo = updateContactInfo(req.body);
    res.json({
      success: true,
      message: "Contact information updated successfully",
      contactInfo,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || "Failed to update contact info",
    });
  }
});

/**
 * PUT /api/site-content/announcement
 * Admin: Update Announcement banner
 */
router.put("/announcement", requireAdmin, (req, res) => {
  try {
    const announcement = updateAnnouncement(req.body);
    res.json({
      success: true,
      message: "Announcement banner updated successfully",
      announcement,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || "Failed to update announcement",
    });
  }
});

/**
 * PUT /api/site-content/navigation
 * Admin: Update whole navigation settings (logo, items order, actions)
 */
router.put("/navigation", requireAdmin, (req, res) => {
  try {
    const navigation = updateNavigation(req.body);
    res.json({
      success: true,
      message: "Navigation bar updated successfully",
      navigation,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || "Failed to update navigation bar",
    });
  }
});

/**
 * POST /api/site-content/navigation/items
 * Admin: Add a new custom navigation item
 */
router.post("/navigation/items", requireAdmin, (req, res) => {
  try {
    const item = addNavItem(req.body);
    res.status(201).json({
      success: true,
      message: `Navigation item "${item.label}" added successfully`,
      item,
      navigation: loadSiteContent().navigation,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || "Failed to add navigation item",
    });
  }
});

/**
 * PUT /api/site-content/navigation/items/:id
 * Admin: Edit a navigation item
 */
router.put("/navigation/items/:id", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const item = updateNavItem(id, req.body);
    res.json({
      success: true,
      message: `Navigation item "${item.label}" updated successfully`,
      item,
      navigation: loadSiteContent().navigation,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err.message || "Failed to update navigation item",
    });
  }
});

/**
 * DELETE /api/site-content/navigation/items/:id
 * Admin: Delete a navigation item
 */
router.delete("/navigation/items/:id", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const deleted = deleteNavItem(id);
    res.json({
      success: true,
      message: `Navigation item "${deleted.label}" removed`,
      deleted,
      navigation: loadSiteContent().navigation,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err.message || "Failed to delete navigation item",
    });
  }
});
/**
 * PUT /api/site-content/categories
 * Admin: Batch update or reorder categories
 */
router.put("/categories", requireAdmin, (req, res) => {
  try {
    const updated = updateGiftingCategories(req.body);
    res.json({
      success: true,
      message: "Gifting categories updated successfully",
      categories: updated,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || "Failed to update gifting categories",
    });
  }
});

/**
 * POST /api/site-content/categories
 * Admin: Add a new gifting category
 */
router.post("/categories", requireAdmin, (req, res) => {
  try {
    const category = addGiftingCategory(req.body);
    res.status(201).json({
      success: true,
      message: `Category "${category.name}" added successfully`,
      category,
      categories: loadSiteContent().giftingCategories,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || "Failed to add category",
    });
  }
});

/**
 * PUT /api/site-content/categories/:id
 * Admin: Update a category
 */
router.put("/categories/:id", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const updated = updateGiftingCategory(id, req.body);
    res.json({
      success: true,
      message: `Category "${updated.name}" updated successfully`,
      category: updated,
      categories: loadSiteContent().giftingCategories,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err.message || "Failed to update category",
    });
  }
});

/**
 * DELETE /api/site-content/categories/:id
 * Admin: Delete a category
 */
router.delete("/categories/:id", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const deleted = deleteGiftingCategory(id);
    res.json({
      success: true,
      message: `Category "${deleted.name}" deleted successfully`,
      deleted,
      categories: loadSiteContent().giftingCategories,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err.message || "Failed to delete category",
    });
  }
});

/**
 * POST /api/site-content/categories/:id/subcategories
 * Admin: Add a subcategory to a category
 */
router.post("/categories/:id/subcategories", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const subcategory = addSubcategory(id, req.body);
    res.status(201).json({
      success: true,
      message: `Subcategory "${subcategory.name}" added successfully`,
      subcategory,
      categories: loadSiteContent().giftingCategories,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || "Failed to add subcategory",
    });
  }
});

/**
 * PUT /api/site-content/categories/:id/subcategories/:subId
 * Admin: Update a subcategory
 */
router.put("/categories/:id/subcategories/:subId", requireAdmin, (req, res) => {
  try {
    const { id, subId } = req.params;
    const updated = updateSubcategory(id, subId, req.body);
    res.json({
      success: true,
      message: `Subcategory "${updated.name}" updated successfully`,
      subcategory: updated,
      categories: loadSiteContent().giftingCategories,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err.message || "Failed to update subcategory",
    });
  }
});

/**
 * DELETE /api/site-content/categories/:id/subcategories/:subId
 * Admin: Delete a subcategory
 */
router.delete("/categories/:id/subcategories/:subId", requireAdmin, (req, res) => {
  try {
    const { id, subId } = req.params;
    const deleted = deleteSubcategory(id, subId);
    res.json({
      success: true,
      message: `Subcategory "${deleted.name}" deleted successfully`,
      deleted,
      categories: loadSiteContent().giftingCategories,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err.message || "Failed to delete subcategory",
    });
  }
});

router.post("/reset", requireAdmin, (req, res) => {
  try {
    const content = resetSiteContentToDefaults();
    res.json({
      success: true,
      message: "Site content reset to factory defaults",
      content,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Failed to reset site content",
    });
  }
});

export default router;
